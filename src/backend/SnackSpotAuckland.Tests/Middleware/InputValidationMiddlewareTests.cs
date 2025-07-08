using System.Net;
using System.Text;
using FluentAssertions;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Middleware;

public class InputValidationMiddlewareTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly WebApplicationFactoryFixture _factory;

    public InputValidationMiddlewareTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("SELECT * FROM users")] // SQL injection
    [InlineData("<script>alert('xss')</script>")] // XSS
    [InlineData("javascript:alert('xss')")] // JavaScript protocol
    [InlineData("../../../etc/passwd")] // Path traversal
    [InlineData("cmd /c dir")] // Command injection
    public async Task InputValidation_ShouldRejectMaliciousContent(string maliciousContent)
    {
        // Arrange
        using var client = _factory.CreateClient();
        var maliciousRequest = new { Username = maliciousContent, Password = "test123" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", maliciousRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        var errorContent = await response.Content.ReadAsStringAsync();
        errorContent.Should().Contain("validation");
    }

    [Fact]
    public async Task InputValidation_ShouldRejectOversizedRequestBody()
    {
        // Arrange
        using var client = _factory.CreateClient();
        
        // Create a request body larger than the configured limit
        var largeString = new string('A', 2 * 1024 * 1024); // 2MB, should exceed 1MB limit
        var largeRequest = new { Username = "test", Password = largeString };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", largeRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("username", "SELECT * FROM users WHERE id = 1")]
    [InlineData("search", "<img src=x onerror=alert(1)>")]
    [InlineData("path", "../../../sensitive/file")]
    public async Task InputValidation_ShouldRejectMaliciousQueryParameters(string paramName, string paramValue)
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync($"/api/v1/categories?{paramName}={Uri.EscapeDataString(paramValue)}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldAllowValidContent()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var validRequest = new { Username = "testuser", Password = "ValidPassword123!" };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", validRequest);

        // Assert
        // Should not be rejected by input validation (may still be 401 due to invalid credentials)
        response.StatusCode.Should().NotBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldRejectExcessivelyLongParameterNames()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var longParamName = new string('a', 150); // Exceeds 100 character limit

        // Act
        var response = await client.GetAsync($"/api/v1/categories?{longParamName}=value");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldRejectExcessivelyLongParameterValues()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var longParamValue = new string('a', 1500); // Exceeds 1000 character limit

        // Act
        var response = await client.GetAsync($"/api/v1/categories?search={longParamValue}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldValidateJsonStructure()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var invalidJson = "{ invalid json structure";
        var content = new StringContent(invalidJson, Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("/api/v1/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldRejectMaliciousHeaders()
    {
        // Arrange
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Custom-Header", "<script>alert('xss')</script>");

        // Act
        var response = await client.GetAsync("/api/v1/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InputValidation_ShouldAllowSystemHeaders()
    {
        // Arrange
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("User-Agent", "TestClient/1.0");
        client.DefaultRequestHeaders.Add("Accept", "application/json");

        // Act
        var response = await client.GetAsync("/api/v1/categories");

        // Assert
        // Should not be rejected due to system headers
        response.StatusCode.Should().NotBe(HttpStatusCode.BadRequest);
    }
}
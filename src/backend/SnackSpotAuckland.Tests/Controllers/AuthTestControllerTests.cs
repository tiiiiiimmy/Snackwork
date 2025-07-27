using System.Net;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class AuthTestController : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public AuthTestController(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task TestJwtToken_Generation_And_Validation()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser("testuser", "test@example.com");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Generate JWT token
        var token = TestAuthHelper.GenerateJwtToken(user);
        
        // Verify token is not null or empty
        token.Should().NotBeNullOrEmpty();
        
        // Set authorization header
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act - Try to access the /api/v1/users/me endpoint which requires authentication
        var response = await _client.GetAsync("/api/v1/users/me");

        // Assert
        Console.WriteLine($"Response Status: {response.StatusCode}");
        Console.WriteLine($"Token: {token}");
        
        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Response Content: {content}");
            
            // Check response headers
            foreach (var header in response.Headers)
            {
                Console.WriteLine($"Response Header: {header.Key} = {string.Join(",", header.Value)}");
            }
        }

        response.StatusCode.Should().Be(HttpStatusCode.OK, "JWT token should authenticate successfully");
    }

    [Fact]
    public async Task TestJwtToken_WithoutAuth_ShouldReturn401()
    {
        // Arrange - Don't set any authorization header
        _client.DefaultRequestHeaders.Authorization = null;

        // Act
        var response = await _client.GetAsync("/api/v1/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TestJwtToken_InvalidToken_ShouldReturn401()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "invalid.jwt.token");

        // Act
        var response = await _client.GetAsync("/api/v1/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
} 
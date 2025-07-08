using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Middleware;

public class RateLimitingMiddlewareTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly WebApplicationFactoryFixture _factory;

    public RateLimitingMiddlewareTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task RateLimit_ShouldAllowRequestsWithinLimit()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act & Assert - Make multiple requests within rate limit
        for (int i = 0; i < 5; i++)
        {
            var response = await client.GetAsync("/api/v1/categories");
            response.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
            
            // Check rate limit headers
            response.Headers.Should().ContainKey("X-RateLimit-Limit");
            response.Headers.Should().ContainKey("X-RateLimit-Remaining");
            response.Headers.Should().ContainKey("X-RateLimit-Reset");
        }
    }

    [Fact]
    public async Task RateLimit_ShouldReturnTooManyRequestsWhenExceeded()
    {
        // Arrange
        using var client = _factory.CreateClient();
        var loginRequest = new { Username = "testuser", Password = "wrongpassword" };

        // Act - Exceed login rate limit (5 requests per minute)
        HttpResponseMessage? lastResponse = null;
        for (int i = 0; i < 10; i++)
        {
            lastResponse = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
            if (lastResponse.StatusCode == HttpStatusCode.TooManyRequests)
            {
                break;
            }
        }

        // Assert
        lastResponse.Should().NotBeNull();
        lastResponse!.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        
        // Check rate limit headers
        lastResponse.Headers.Should().ContainKey("Retry-After");
        lastResponse.Headers.Should().ContainKey("X-RateLimit-Limit");
        lastResponse.Headers.GetValues("X-RateLimit-Remaining").First().Should().Be("0");
        
        // Check error response format
        var errorContent = await lastResponse.Content.ReadAsStringAsync();
        errorContent.Should().Contain("Rate limit exceeded");
    }

    [Fact]
    public async Task RateLimit_ShouldHaveDifferentLimitsForDifferentEndpoints()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act & Assert - Test that categories endpoint has higher limit than auth endpoints
        var categoriesResponse = await client.GetAsync("/api/v1/categories");
        categoriesResponse.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests);
        
        var rateLimitHeader = categoriesResponse.Headers.GetValues("X-RateLimit-Limit").First();
        int.Parse(rateLimitHeader).Should().BeGreaterThan(5); // Should be higher than auth limit
    }

    [Fact]
    public async Task RateLimit_ShouldIncludeCorrectHeaderValues()
    {
        // Arrange
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/categories");

        // Assert
        response.Headers.Should().ContainKey("X-RateLimit-Limit");
        response.Headers.Should().ContainKey("X-RateLimit-Remaining");
        response.Headers.Should().ContainKey("X-RateLimit-Reset");

        var limit = int.Parse(response.Headers.GetValues("X-RateLimit-Limit").First());
        var remaining = int.Parse(response.Headers.GetValues("X-RateLimit-Remaining").First());
        var reset = long.Parse(response.Headers.GetValues("X-RateLimit-Reset").First());

        limit.Should().BeGreaterThan(0);
        remaining.Should().BeLessThanOrEqualTo(limit);
        reset.Should().BeGreaterThan(0);
    }
}
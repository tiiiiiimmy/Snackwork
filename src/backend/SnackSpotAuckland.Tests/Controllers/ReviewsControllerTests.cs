using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class ReviewsControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public ReviewsControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateReview_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var reviewRequest = new
        {
            SnackId = Guid.NewGuid(),
            Rating = 4,
            Comment = "Test review"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/reviews", reviewRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetReviewsBySnack_ShouldReturnReviews()
    {
        // Arrange
        var user1 = TestDataFactory.CreateUser("user1", "user1@test.com");
        var user2 = TestDataFactory.CreateUser("user2", "user2@test.com");
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var review1 = TestDataFactory.CreateReview(user1.Id, snack.Id, 4);
        var review2 = TestDataFactory.CreateReview(user2.Id, snack.Id, 5);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.AddRange(user1, user2);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.AddRange(review1, review2);
            context.SaveChanges();
        }

        // Act
        var response = await _client.GetAsync($"/api/v1/reviews/snack/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var reviews = await response.Content.ReadFromJsonAsync<List<ReviewResponse>>();
        reviews.Should().NotBeNull();
        reviews!.Should().HaveCount(2);
        reviews.Should().OnlyContain(r => r.SnackId == snack.Id);
    }

    private class ReviewResponse
    {
        public Guid Id { get; set; }
        public Guid SnackId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
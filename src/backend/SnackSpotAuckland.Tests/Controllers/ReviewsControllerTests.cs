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
    public async Task CreateReview_WithValidData_ShouldReturnCreatedReview()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var reviewRequest = new
        {
            SnackId = snack.Id,
            Rating = 4,
            Comment = "Great snack, really enjoyed it!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/reviews", reviewRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdReview = await response.Content.ReadFromJsonAsync<ReviewResponse>();
        createdReview.Should().NotBeNull();
        createdReview!.Rating.Should().Be(reviewRequest.Rating);
        createdReview.Comment.Should().Be(reviewRequest.Comment);
        createdReview.SnackId.Should().Be(snack.Id);

        // Verify in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var dbReview = context.Reviews.FirstOrDefault(r => r.Id == createdReview.Id);
        dbReview.Should().NotBeNull();
        dbReview!.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task CreateReview_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        TestAuthHelper.RemoveAuthorizationHeader(_client);
        
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

    [Theory]
    [InlineData(0)] // Rating too low
    [InlineData(6)] // Rating too high
    [InlineData(-1)] // Negative rating
    public async Task CreateReview_WithInvalidRating_ShouldReturnBadRequest(int invalidRating)
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var reviewRequest = new
        {
            SnackId = snack.Id,
            Rating = invalidRating,
            Comment = "Test review"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/reviews", reviewRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateReview_ForNonExistentSnack_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var reviewRequest = new
        {
            SnackId = Guid.NewGuid(), // Non-existent snack
            Rating = 4,
            Comment = "Test review"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/reviews", reviewRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateReview_DuplicateReviewFromSameUser_ShouldReturnConflict()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var existingReview = TestDataFactory.CreateReview(user.Id, snack.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.Add(existingReview);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var reviewRequest = new
        {
            SnackId = snack.Id,
            Rating = 5,
            Comment = "Another review from same user"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/reviews", reviewRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
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

    [Fact]
    public async Task UpdateReview_AsOwner_ShouldReturnUpdatedReview()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var review = TestDataFactory.CreateReview(user.Id, snack.Id, 3);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.Add(review);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var updateRequest = new
        {
            Rating = 5,
            Comment = "Updated review - much better than I initially thought!"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/reviews/{review.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updatedReview = await response.Content.ReadFromJsonAsync<ReviewResponse>();
        updatedReview.Should().NotBeNull();
        updatedReview!.Rating.Should().Be(updateRequest.Rating);
        updatedReview.Comment.Should().Be(updateRequest.Comment);
    }

    [Fact]
    public async Task UpdateReview_AsNonOwner_ShouldReturnForbidden()
    {
        // Arrange
        var owner = TestDataFactory.CreateUser("owner", "owner@test.com");
        var otherUser = TestDataFactory.CreateUser("other", "other@test.com");
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var review = TestDataFactory.CreateReview(owner.Id, snack.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.AddRange(owner, otherUser);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.Add(review);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(otherUser);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var updateRequest = new { Rating = 1, Comment = "Attempted unauthorized update" };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/reviews/{review.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteReview_AsOwner_ShouldReturnNoContent()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var review = TestDataFactory.CreateReview(user.Id, snack.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.Add(review);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        // Act
        var response = await _client.DeleteAsync($"/api/v1/reviews/{review.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var deletedReview = context.Reviews.FirstOrDefault(r => r.Id == review.Id);
        deletedReview.Should().BeNull();
    }

    [Fact]
    public async Task DeleteReview_AsNonOwner_ShouldReturnForbidden()
    {
        // Arrange
        var owner = TestDataFactory.CreateUser("owner", "owner@test.com");
        var otherUser = TestDataFactory.CreateUser("other", "other@test.com");
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(Guid.NewGuid(), category.Id);
        var review = TestDataFactory.CreateReview(owner.Id, snack.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.AddRange(owner, otherUser);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.Reviews.Add(review);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(otherUser);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        // Act
        var response = await _client.DeleteAsync($"/api/v1/reviews/{review.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Verify review still exists
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var existingReview = context.Reviews.FirstOrDefault(r => r.Id == review.Id);
        existingReview.Should().NotBeNull();
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
using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class UsersControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public UsersControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ClearAuthHeaders()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetUser_ShouldReturnUser_WhenUserExists()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser("testuser", "test@example.com");
        user.Level = 2;
        user.ExperiencePoints = 150;
        user.InstagramHandle = "testuser_insta";
        user.Bio = "Test bio description";
        user.AvatarEmoji = "😊";

        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{user.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("testuser");
        content.Should().NotContain("test@example.com"); // Email should not be exposed
        content.Should().Contain("testuser_insta");
        content.Should().Contain("Test bio description");
        content.Should().Contain("\\uD83D\\uDE0A"); // Unicode escaped version of 😊
        content.Should().Contain("\"level\":2");
        content.Should().Contain("\"experiencePoints\":150");
    }

    [Fact]
    public async Task GetUser_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        ClearAuthHeaders();
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("User not found");
    }

    [Fact]
    public async Task GetUser_ShouldIncludeStatistics_WhenUserHasActivity()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var store = TestDataFactory.CreateStore(user.Id, "Test Store");
        var snack1 = TestDataFactory.CreateSnack(user.Id, category.Id);
        snack1.StoreId = store.Id;
        var snack2 = TestDataFactory.CreateSnack(user.Id, category.Id);
        snack2.StoreId = store.Id;
        var review1 = TestDataFactory.CreateReview(user.Id, snack1.Id, 4);
        var review2 = TestDataFactory.CreateReview(user.Id, snack2.Id, 5);

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.AddRange(snack1, snack2);
        context.Reviews.AddRange(review1, review2);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{user.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("\"totalSnacks\":2");
        content.Should().Contain("\"totalReviews\":2");
        content.Should().Contain("\"averageRatingGiven\":4.5");
    }

    [Fact]
    public async Task GetUser_ShouldIncludeBadges_WhenUserMeetsRequirements()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        user.Level = 3; // For level badge
        
        var category = TestDataFactory.CreateCategory();
        var store = TestDataFactory.CreateStore(user.Id, "Test Store");
        
        // Add enough snacks for badges
        var snacks = new List<Snack>();
        for (int i = 0; i < 15; i++)
        {
            var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
            snack.StoreId = store.Id;
            snacks.Add(snack);
        }

        // Add enough reviews for badge
        var reviews = new List<Review>();
        for (int i = 0; i < 10; i++)
        {
            reviews.Add(TestDataFactory.CreateReview(user.Id, snacks[i % snacks.Count].Id));
        }

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.AddRange(snacks);
        context.Reviews.AddRange(reviews);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{user.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Snack Explorer"); // 10+ snacks
        content.Should().Contain("Reviewer"); // 5+ reviews
        content.Should().Contain("Level 3"); // Level 3 achieved
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();

        // Act
        var response = await _client.GetAsync("/api/v1/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnCurrentUser_WhenAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser("currentuser", "current@example.com");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/users/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("currentuser");
        content.Should().Contain(user.Id.ToString());
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        var updateRequest = new
        {
            Username = "newusername",
            Bio = "New bio"
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/v1/users/me", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateProfile_ShouldUpdateUser_WhenAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser("oldusername", "user@example.com");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateRequest = new
        {
            Username = "newusername",
            Bio = "Updated bio",
            InstagramHandle = "new_insta",
            AvatarEmoji = "🎉"
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/v1/users/me", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("newusername");
        content.Should().Contain("Updated bio");
        content.Should().Contain("new_insta");
        content.Should().Contain("🎉");

        // Verify in database
        var updatedUser = await context.Users.FindAsync(user.Id);
        updatedUser!.Username.Should().Be("newusername");
        updatedUser.Bio.Should().Be("Updated bio");
        updatedUser.InstagramHandle.Should().Be("new_insta");
        updatedUser.AvatarEmoji.Should().Be("🎉");
    }

    [Fact]
    public async Task UpdateProfile_ShouldReturnBadRequest_WhenUsernameAlreadyTaken()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user1 = TestDataFactory.CreateUser("user1", "user1@example.com");
        var user2 = TestDataFactory.CreateUser("user2", "user2@example.com");
        
        context.Users.AddRange(user1, user2);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user1);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateRequest = new
        {
            Username = "user2" // Already taken by user2
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/v1/users/me", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Username already taken");
    }

    [Fact]
    public async Task UpdateProfile_ShouldAllowSameUsername_WhenKeepingCurrentUsername()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser("existinguser", "user@example.com");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var updateRequest = new
        {
            Username = "existinguser", // Same as current
            Bio = "Updated bio only"
        };

        // Act
        var response = await _client.PutAsJsonAsync("/api/v1/users/me", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Updated bio only");
    }

    [Fact]
    public async Task GetUserSnacks_ShouldReturnUserSnacks_WhenUserExists()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var otherUser = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        
        // Create stores first
        var store1 = TestDataFactory.CreateStore(user.Id, "Store 1");
        var store2 = TestDataFactory.CreateStore(user.Id, "Store 2");
        var otherStore = TestDataFactory.CreateStore(otherUser.Id, "Other Store");
        
        var userSnack1 = TestDataFactory.CreateSnack(user.Id, category.Id, "User Snack 1");
        userSnack1.StoreId = store1.Id;
        var userSnack2 = TestDataFactory.CreateSnack(user.Id, category.Id, "User Snack 2");
        userSnack2.StoreId = store2.Id;
        var otherUserSnack = TestDataFactory.CreateSnack(otherUser.Id, category.Id, "Other User Snack");
        otherUserSnack.StoreId = otherStore.Id;

        context.Users.AddRange(user, otherUser);
        context.Categories.Add(category);
        context.Stores.AddRange(store1, store2, otherStore);
        context.Snacks.AddRange(userSnack1, userSnack2, otherUserSnack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{user.Id}/snacks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("User Snack 1");
        content.Should().Contain("User Snack 2");
        content.Should().NotContain("Other User Snack");
    }

    [Fact]
    public async Task GetUserSnacks_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        ClearAuthHeaders();
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{nonExistentId}/snacks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("User not found");
    }

    [Fact]
    public async Task GetUserSnacks_ShouldExcludeDeletedSnacks()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        
        // Create store first
        var store = TestDataFactory.CreateStore(user.Id, "Test Store");
        
        var activeSnack = TestDataFactory.CreateSnack(user.Id, category.Id, "Active Snack");
        activeSnack.StoreId = store.Id;
        var deletedSnack = TestDataFactory.CreateSnack(user.Id, category.Id, "Deleted Snack");
        deletedSnack.StoreId = store.Id;
        deletedSnack.IsDeleted = true;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.AddRange(activeSnack, deletedSnack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/users/{user.Id}/snacks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Active Snack");
        content.Should().NotContain("Deleted Snack");
    }
} 
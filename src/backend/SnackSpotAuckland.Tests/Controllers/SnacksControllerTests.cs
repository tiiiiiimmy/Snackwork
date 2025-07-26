using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class SnacksControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public SnacksControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetNearbySnacks_WithValidParameters_ShouldReturnSnacks()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        // Act
        var response = await _client.GetAsync("/api/v1/snacks?lat=-36.8485&lng=174.7633&radius=10000");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var snacks = await response.Content.ReadFromJsonAsync<List<SnackResponse>>();
        snacks.Should().NotBeNull();
        snacks!.Should().HaveCount(1);
        snacks[0].Name.Should().Be(snack.Name);
    }

    [Theory]
    [InlineData("?lat=invalid&lng=174.7633&radius=1000")] // Invalid latitude
    [InlineData("?lat=-36.8485&lng=invalid&radius=1000")] // Invalid longitude
    [InlineData("?lat=-36.8485&lng=174.7633&radius=invalid")] // Invalid radius
    [InlineData("?lat=-91&lng=174.7633&radius=1000")] // Latitude out of range
    [InlineData("?lat=-36.8485&lng=181&radius=1000")] // Longitude out of range
    [InlineData("?lat=-36.8485&lng=174.7633&radius=-1000")] // Negative radius
    public async Task GetNearbySnacks_WithInvalidParameters_ShouldReturnBadRequest(string queryString)
    {
        // Act
        var response = await _client.GetAsync($"/api/v1/snacks{queryString}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetNearbySnacks_WithMissingParameters_ShouldReturnBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/snacks?lat=-36.8485"); // Missing lng and radius

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSnackById_WithValidId_ShouldReturnSnack()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        // Act
        var response = await _client.GetAsync($"/api/v1/snacks/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var returnedSnack = await response.Content.ReadFromJsonAsync<SnackResponse>();
        returnedSnack.Should().NotBeNull();
        returnedSnack!.Id.Should().Be(snack.Id);
        returnedSnack.Name.Should().Be(snack.Name);
        returnedSnack.Description.Should().Be(snack.Description);
    }

    [Fact]
    public async Task GetSnackById_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/snacks/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetSnackById_WithInvalidId_ShouldReturnBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/snacks/invalid-id");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateSnack_WithValidData_ShouldReturnCreatedSnack()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var createRequest = new
        {
            Name = "Test Snack",
            Description = "A delicious test snack",
            CategoryId = category.Id,
            Location = new { Lat = -36.8485, Lng = 174.7633 },
            ShopName = "Test Shop",
            ShopAddress = "123 Test Street, Auckland"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/snacks", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var createdSnack = await response.Content.ReadFromJsonAsync<SnackResponse>();
        createdSnack.Should().NotBeNull();
        createdSnack!.Name.Should().Be(createRequest.Name);
        createdSnack.Description.Should().Be(createRequest.Description);
        createdSnack.ShopName.Should().Be(createRequest.ShopName);

        // Verify in database
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var dbSnack = verifyContext.Snacks.FirstOrDefault(s => s.Id == createdSnack.Id);
        dbSnack.Should().NotBeNull();
        dbSnack!.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task CreateSnack_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        TestAuthHelper.RemoveAuthorizationHeader(_client);
        
        var createRequest = TestDataFactory.SnackData.ValidCreateRequest;

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/snacks", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("", "Valid description", true)] // Empty name
    [InlineData("Valid name", "", false)] // Empty description (should be allowed)
    [InlineData("A", "Valid description", true)] // Name too short
    public async Task CreateSnack_WithInvalidData_ShouldReturnBadRequest(string name, string description, bool shouldFail)
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.Categories.Add(category);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var createRequest = new
        {
            Name = name,
            Description = description,
            CategoryId = category.Id,
            Location = new { Lat = -36.8485, Lng = 174.7633 },
            ShopName = "Test Shop",
            ShopAddress = "123 Test Street, Auckland"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/snacks", createRequest);

        // Assert
        if (shouldFail)
        {
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
        else
        {
            response.StatusCode.Should().Be(HttpStatusCode.Created);
        }
    }

    [Fact]
    public async Task CreateSnack_WithNonExistentCategory_ShouldReturnBadRequest()
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

        var createRequest = new
        {
            Name = "Test Snack",
            Description = "A test snack",
            CategoryId = Guid.NewGuid(), // Non-existent category
            Location = new { Lat = -36.8485, Lng = 174.7633 },
            ShopName = "Test Shop"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/snacks", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateSnack_AsOwner_ShouldReturnUpdatedSnack()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        
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

        var updateRequest = new
        {
            Name = "Updated Snack Name",
            Description = "Updated description",
            ShopName = "Updated Shop Name"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/snacks/{snack.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updatedSnack = await response.Content.ReadFromJsonAsync<SnackResponse>();
        updatedSnack.Should().NotBeNull();
        updatedSnack!.Name.Should().Be(updateRequest.Name);
        updatedSnack.Description.Should().Be(updateRequest.Description);
        updatedSnack.ShopName.Should().Be(updateRequest.ShopName);
    }

    [Fact]
    public async Task UpdateSnack_AsNonOwner_ShouldReturnForbidden()
    {
        // Arrange
        var owner = TestDataFactory.CreateUser("owner", "owner@test.com");
        var otherUser = TestDataFactory.CreateUser("other", "other@test.com");
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(owner.Id, category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.AddRange(owner, otherUser);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(otherUser);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        var updateRequest = new { Name = "Attempted Update" };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/snacks/{snack.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteSnack_AsOwner_ShouldReturnNoContent()
    {
        // Arrange
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        
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

        // Act
        var response = await _client.DeleteAsync($"/api/v1/snacks/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion in database
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var deletedSnack = verifyContext.Snacks.FirstOrDefault(s => s.Id == snack.Id);
        deletedSnack.Should().BeNull();
    }

    [Fact]
    public async Task DeleteSnack_AsNonOwner_ShouldReturnForbidden()
    {
        // Arrange
        var owner = TestDataFactory.CreateUser("owner", "owner@test.com");
        var otherUser = TestDataFactory.CreateUser("other", "other@test.com");
        var category = TestDataFactory.CreateCategory();
        var snack = TestDataFactory.CreateSnack(owner.Id, category.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.AddRange(owner, otherUser);
            context.Categories.Add(category);
            context.Snacks.Add(snack);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(otherUser);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        // Act
        var response = await _client.DeleteAsync($"/api/v1/snacks/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        // Verify snack still exists
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var existingSnack = verifyContext.Snacks.FirstOrDefault(s => s.Id == snack.Id);
        existingSnack.Should().NotBeNull();
    }

    private class SnackResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // API returns category name as string
        public string? ImageUrl { get; set; }
        public string ShopName { get; set; } = string.Empty;
        public string ShopAddress { get; set; } = string.Empty;
        public decimal AverageRating { get; set; }
        public int TotalRatings { get; set; }
        public LocationResponse Location { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public UserResponse User { get; set; } = new();
    }

    private class LocationResponse
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    private class UserResponse
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
    }
}
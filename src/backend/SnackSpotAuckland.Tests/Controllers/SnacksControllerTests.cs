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

    private void ClearAuthHeaders()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetNearbySnacks_WithValidParameters_ShouldReturnSnacks()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var store = TestDataFactory.CreateStore(user.Id, "Test Store");
        // Set store location close to the query location
        store.Latitude = -36.8485m;
        store.Longitude = 174.7633m;
        
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        snack.StoreId = store.Id;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/snacks?lat=-36.8485&lng=174.7633&radius=1000");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        var snacks = System.Text.Json.JsonSerializer.Deserialize<List<object>>(content);
        snacks!.Should().NotBeEmpty();
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
        // Arrange
        ClearAuthHeaders();
        
        // Act
        var response = await _client.GetAsync("/api/v1/snacks?lng=174.7633");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetSnackById_WithValidId_ShouldReturnSnack()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var store = TestDataFactory.CreateStore(user.Id, "Test Store");
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        snack.StoreId = store.Id;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/snacks/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain(snack.Id.ToString());
    }

    [Fact]
    public async Task GetSnackById_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        ClearAuthHeaders();

        // Act
        var response = await _client.GetAsync($"/api/v1/snacks/{Guid.NewGuid()}");

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
    public async Task CreateSnack_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        var createRequest = new
        {
            Name = "Test Snack",
            Description = "A delicious test snack",
            CategoryId = Guid.NewGuid(),
            Location = new { Lat = -36.8485, Lng = 174.7633 },
            ShopName = "Test Shop"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/snacks", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
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
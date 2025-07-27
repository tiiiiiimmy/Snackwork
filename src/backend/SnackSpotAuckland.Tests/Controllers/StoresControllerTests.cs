using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class StoresControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public StoresControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ClearAuthHeaders()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetStores_ShouldReturnStores_WhenStoresExist()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var store1 = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Test Store 1",
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        var store2 = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Test Store 2",
            Address = "456 Test Avenue",
            Latitude = -36.8500m,
            Longitude = 174.7650m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Stores.AddRange(store1, store2);
        await context.SaveChangesAsync();

        // Authenticate for this request since StoresController requires authorization
        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/stores");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Test Store 1");
        content.Should().Contain("Test Store 2");
    }

    [Fact]
    public async Task GetStores_ShouldFilterBySearch_WhenSearchProvided()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var store1 = new Store
        {
            Id = Guid.NewGuid(),
            Name = "McDonald's",
            Address = "123 Queen Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        var store2 = new Store
        {
            Id = Guid.NewGuid(),
            Name = "KFC",
            Address = "456 Test Avenue",
            Latitude = -36.8500m,
            Longitude = 174.7650m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Stores.AddRange(store1, store2);
        await context.SaveChangesAsync();

        // Authenticate for this request
        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/stores?search=mcdonald");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("McDonald's");
        content.Should().NotContain("KFC");
    }

    [Fact]
    public async Task CreateStore_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        var createRequest = new
        {
            Name = "New Store",
            Address = "123 New Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/stores", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateStore_ShouldCreateStore_WhenAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Name = "New Store",
            Address = "123 New Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/stores", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("New Store");
    }

    [Fact]
    public async Task CreateStore_ShouldReturnExistingStore_WhenDuplicateStoreExists()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var existingStore = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Existing Store",
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Stores.Add(existingStore);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new
        {
            Name = "existing store", // Different case
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/stores", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain(existingStore.Id.ToString());
    }

    [Fact]
    public async Task GetStore_ShouldReturnStore_WhenStoreExists()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var store = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Test Store",
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Stores.Add(store);
        await context.SaveChangesAsync();

        // Authenticate for this request
        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/api/v1/stores/{store.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Test Store");
    }

    [Fact]
    public async Task GetStore_ShouldReturnNotFound_WhenStoreDoesNotExist()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Authenticate for this request
        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/stores/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteStore_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        var storeId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/stores/{storeId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteStore_ShouldDeleteStore_WhenStoreHasNoActiveSnacks()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var store = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Test Store",
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.Stores.Add(store);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.DeleteAsync($"/api/v1/stores/{store.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify store is soft deleted
        var deletedStore = await context.Stores.FindAsync(store.Id);
        deletedStore.Should().NotBeNull();
        deletedStore!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteStore_ShouldReturnBadRequest_WhenStoreHasActiveSnacks()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var category = TestDataFactory.CreateCategory();
        var store = new Store
        {
            Id = Guid.NewGuid(),
            Name = "Test Store",
            Address = "123 Test Street",
            Latitude = -36.8485m,
            Longitude = 174.7633m,
            CreatedByUserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };
        var snack = TestDataFactory.CreateSnack(user.Id, category.Id);
        snack.StoreId = store.Id;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.DeleteAsync($"/api/v1/stores/{store.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Cannot delete store that has active snacks");
    }
} 
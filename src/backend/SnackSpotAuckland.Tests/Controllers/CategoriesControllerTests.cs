using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class CategoriesControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public CategoriesControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ClearAuthHeaders()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetCategories_ShouldReturnCategories_WhenCategoriesExist()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var category1 = TestDataFactory.CreateCategory("Sweet Snacks");
        var category2 = TestDataFactory.CreateCategory("Healthy Snacks");
        var category3 = TestDataFactory.CreateCategory("Drinks");
        
        // Add deleted category that should not appear
        var deletedCategory = TestDataFactory.CreateCategory("Deleted Category");
        deletedCategory.IsDeleted = true;

        context.Categories.AddRange(category1, category2, category3, deletedCategory);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Sweet Snacks");
        content.Should().Contain("Healthy Snacks");
        content.Should().Contain("Drinks");
        content.Should().NotContain("Deleted Category");
    }

    [Fact]
    public async Task GetCategories_ShouldReturnEmptyList_WhenNoCategoriesExist()
    {
        // Arrange - no categories added

        // Act
        var response = await _client.GetAsync("/api/v1/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("[]");
    }

    [Fact]
    public async Task GetCategory_ShouldReturnCategory_WhenCategoryExists()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var category = TestDataFactory.CreateCategory("Test Category");
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/categories/{category.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Test Category");
        content.Should().Contain(category.Id.ToString());
    }

    [Fact]
    public async Task GetCategory_ShouldReturnNotFound_WhenCategoryDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/categories/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Category not found");
    }

    [Fact]
    public async Task GetCategory_ShouldReturnNotFound_WhenCategoryIsDeleted()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var category = TestDataFactory.CreateCategory("Deleted Category");
        category.IsDeleted = true;
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/categories/{category.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateCategory_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        ClearAuthHeaders();
        var createRequest = new Category
        {
            Name = "New Category",
            Description = "A new test category"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/categories", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateCategory_ShouldCreateCategory_WhenAuthenticated()
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

        var createRequest = new Category
        {
            Name = "New Category",
            Description = "A new test category"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/categories", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("New Category");
        content.Should().Contain("A new test category");
    }

    [Fact]
    public async Task CreateCategory_ShouldNormalizeName_WhenCreatingCategory()
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

        var createRequest = new Category
        {
            Name = "  Multiple   Spaces   Category  ",
            Description = "Test normalization"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/categories", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Multiple Spaces Category"); // Normalized
        content.Should().NotContain("  Multiple   Spaces   Category  "); // Original
    }

    [Fact]
    public async Task CreateCategory_ShouldReturnExistingCategory_WhenDuplicateNameExists()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var user = TestDataFactory.CreateUser();
        var existingCategory = TestDataFactory.CreateCategory("Existing Category");
        
        context.Users.Add(user);
        context.Categories.Add(existingCategory);
        await context.SaveChangesAsync();

        var token = TestAuthHelper.GenerateJwtToken(user);
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var createRequest = new Category
        {
            Name = "EXISTING CATEGORY", // Different case
            Description = "Should return existing"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/categories", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain(existingCategory.Id.ToString());
        content.Should().Contain("Existing Category");
    }

    [Fact]
    public async Task CreateCategory_ShouldReturnBadRequest_WhenModelStateInvalid()
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

        var createRequest = new Category
        {
            Name = "", // Invalid: empty name
            Description = "Test description"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/categories", createRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetCategories_ShouldReturnCategoriesInAlphabeticalOrder()
    {
        // Arrange
        ClearAuthHeaders();
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        
        var categoryZ = TestDataFactory.CreateCategory("Zebra Category");
        var categoryA = TestDataFactory.CreateCategory("Apple Category");
        var categoryM = TestDataFactory.CreateCategory("Mango Category");

        context.Categories.AddRange(categoryZ, categoryA, categoryM);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/v1/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        
        // Check that Apple comes before Mango which comes before Zebra
        var appleIndex = content.IndexOf("Apple Category");
        var mangoIndex = content.IndexOf("Mango Category");
        var zebraIndex = content.IndexOf("Zebra Category");
        
        appleIndex.Should().BeLessThan(mangoIndex);
        mangoIndex.Should().BeLessThan(zebraIndex);
    }
} 
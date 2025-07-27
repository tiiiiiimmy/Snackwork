using System.Net;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class ImagesControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public ImagesControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ClearAuthHeaders()
    {
        _client.DefaultRequestHeaders.Authorization = null;
    }

    [Fact]
    public async Task GetImage_ShouldReturnImage_WhenSnackHasImage()
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
        
        // Create a mock JPEG image (with proper magic bytes)
        var jpegImageData = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46 };
        snack.Image = jpegImageData;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("image/jpeg");
        
        // Check cache headers
        response.Headers.CacheControl?.MaxAge.Should().Be(TimeSpan.FromSeconds(31536000));
        response.Headers.CacheControl?.Extensions.Should().Contain(x => x.Name == "immutable");

        var imageBytes = await response.Content.ReadAsByteArrayAsync();
        imageBytes.Should().BeEquivalentTo(jpegImageData);
    }

    [Fact]
    public async Task GetImage_ShouldReturnPngContentType_WhenImageIsPng()
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
        
        // Create a mock PNG image (with proper magic bytes)
        var pngImageData = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        snack.Image = pngImageData;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("image/png");
    }

    [Fact]
    public async Task GetImage_ShouldReturnWebpContentType_WhenImageIsWebp()
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
        
        // Create a mock WebP image (with proper magic bytes)
        var webpImageData = new byte[] { 0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50 };
        snack.Image = webpImageData;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("image/webp");
    }

    [Fact]
    public async Task GetImage_ShouldReturnOctetStream_WhenImageFormatUnknown()
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
        
        // Create unknown format image data
        var unknownImageData = new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00 };
        snack.Image = unknownImageData;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/octet-stream");
    }

    [Fact]
    public async Task GetImage_ShouldReturnNotFound_WhenSnackDoesNotExist()
    {
        // Arrange
        ClearAuthHeaders();
        var nonExistentSnackId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{nonExistentSnackId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetImage_ShouldReturnNotFound_WhenSnackHasNoImage()
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
        snack.Image = null; // No image

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetImage_ShouldReturnNotFound_WhenSnackIsDeleted()
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
        snack.Image = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }; // JPEG image
        snack.IsDeleted = true; // Mark as deleted

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetImage_ShouldReturnOctetStream_WhenImageDataTooSmall()
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
        
        // Image data with less than 4 bytes
        var smallImageData = new byte[] { 0xFF, 0xD8 };
        snack.Image = smallImageData;

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/octet-stream");
    }

    [Fact]
    public async Task GetImage_ShouldHaveCorrectCacheHeaders()
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
        snack.Image = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }; // JPEG image

        context.Users.Add(user);
        context.Categories.Add(category);
        context.Stores.Add(store);
        context.Snacks.Add(snack);
        await context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/v1/images/{snack.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify cache control headers
        var cacheControl = response.Headers.CacheControl;
        cacheControl.Should().NotBeNull();
        cacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(31536000)); // 1 year
        cacheControl.Extensions.Should().Contain(x => x.Name == "immutable");
    }
} 
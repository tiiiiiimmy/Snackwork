using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using SnackSpotAuckland.Tests.Helpers;
using SnackSpotAuckland.Tests.TestFixtures;

namespace SnackSpotAuckland.Tests.Controllers;

public class AuthControllerTests : IClassFixture<WebApplicationFactoryFixture>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactoryFixture _factory;

    public AuthControllerTests(WebApplicationFactoryFixture factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var registerRequest = new
        {
            Username = "testuser123",
            Email = "testuser123@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();

        // Verify user was created in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var user = context.Users.FirstOrDefault(u => u.Username == registerRequest.Username);
        user.Should().NotBeNull();
        user!.Email.Should().Be(registerRequest.Email);
    }

    [Fact]
    public async Task Register_WithDuplicateUsername_ShouldReturnBadRequest()
    {
        // Arrange
        var existingUser = TestDataFactory.CreateUser("existinguser", "existing@example.com");
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(existingUser);
            context.SaveChanges();
        }

        var registerRequest = new
        {
            Username = "existinguser",
            Email = "different@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturnBadRequest()
    {
        // Arrange
        var existingUser = TestDataFactory.CreateUser("existinguser2", "duplicate@example.com");
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(existingUser);
            context.SaveChanges();
        }

        var registerRequest = new
        {
            Username = "newuser",
            Email = "duplicate@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("", "test@example.com", "TestPassword123!")] // Empty username
    [InlineData("ab", "test@example.com", "TestPassword123!")] // Username too short
    [InlineData("testuser", "invalid-email", "TestPassword123!")] // Invalid email
    [InlineData("testuser", "test@example.com", "123")] // Weak password
    [InlineData("testuser", "test@example.com", "")] // Empty password
    public async Task Register_WithInvalidData_ShouldReturnBadRequest(string username, string email, string password)
    {
        // Arrange
        var registerRequest = new
        {
            Username = username,
            Email = email,
            Password = password
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateUser("loginuser", "loginuser@example.com");
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.SaveChanges();
        }

        var loginRequest = new
        {
            Email = "loginuser@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        loginResponse.Should().NotBeNull();
        loginResponse!.AccessToken.Should().NotBeNullOrEmpty();

        // Verify refresh token was stored
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var refreshToken = verifyContext.RefreshTokens.FirstOrDefault(rt => rt.UserId == user.Id);
        refreshToken.Should().NotBeNull();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
    {
        // Arrange
        var user = TestDataFactory.CreateUser("loginuser2", "loginuser2@example.com");
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.SaveChanges();
        }

        var loginRequest = new
        {
            Email = "loginuser2@example.com",
            Password = "WrongPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ShouldReturnUnauthorized()
    {
        // Arrange
        var loginRequest = new
        {
            Email = "nonexistentuser@example.com",
            Password = "TestPassword123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("", "TestPassword123!")] // Empty email
    [InlineData("testuser@example.com", "")] // Empty password
    public async Task Login_WithMissingData_ShouldReturnBadRequest(string email, string password)
    {
        // Arrange
        var loginRequest = new
        {
            Email = email,
            Password = password
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Profile_WithValidToken_ShouldReturnUserProfile()
    {
        // Arrange
        var user = TestDataFactory.CreateUser("profileuser", "profileuser@example.com");
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        // Act
        var response = await _client.GetAsync("/api/v1/auth/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var profile = await response.Content.ReadFromJsonAsync<UserProfile>();
        profile.Should().NotBeNull();
        profile!.Username.Should().Be(user.Username);
        profile.Email.Should().Be(user.Email);
        profile.Level.Should().Be(user.Level);
    }

    [Fact]
    public async Task Profile_WithoutToken_ShouldReturnUnauthorized()
    {
        // Arrange
        TestAuthHelper.RemoveAuthorizationHeader(_client);

        // Act
        var response = await _client.GetAsync("/api/v1/auth/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Profile_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange
        TestAuthHelper.AddAuthorizationHeader(_client, "invalid.jwt.token");

        // Act
        var response = await _client.GetAsync("/api/v1/auth/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Profile_WithExpiredToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var user = TestDataFactory.CreateUser("expireduser", "expired@example.com");
        var expiredToken = TestAuthHelper.GenerateExpiredJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, expiredToken);

        // Act
        var response = await _client.GetAsync("/api/v1/auth/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Logout_WithValidToken_ShouldReturnSuccess()
    {
        // Arrange
        var user = TestDataFactory.CreateUser("logoutuser", "logout@example.com");
        var refreshToken = TestDataFactory.CreateRefreshToken(user.Id);
        
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Users.Add(user);
            context.RefreshTokens.Add(refreshToken);
            context.SaveChanges();
        }

        var token = TestAuthHelper.GenerateJwtToken(user);
        TestAuthHelper.AddAuthorizationHeader(_client, token);

        // Act
        var response = await _client.PostAsync("/api/v1/auth/logout", null);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify refresh tokens were revoked
        using var verifyScope = _factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        var tokens = verifyContext.RefreshTokens.Where(rt => rt.UserId == user.Id).ToList();
        tokens.Should().AllSatisfy(t => t.IsRevoked.Should().BeTrue());
    }

    private class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public User User { get; set; } = null!;
    }

    private class UserProfile
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Level { get; set; }
        public int ExperiencePoints { get; set; }
    }
}
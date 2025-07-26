using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SnackSpotAuckland.Api.Models;

namespace SnackSpotAuckland.Tests.Helpers;

public static class TestAuthHelper
{
    private const string TestJwtKey = "test-super-secret-key-at-least-256-bits-long-for-security-testing-purposes";
    private const string TestIssuer = "SnackSpotAuckland.Tests";
    private const string TestAudience = "SnackSpotAuckland.Tests";

    public static string GenerateJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(TestJwtKey);
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("level", user.Level.ToString()),
                new Claim("experience", user.ExperiencePoints.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = TestIssuer,
            Audience = TestAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public static string GenerateExpiredJwtToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(TestJwtKey);
        
        var now = DateTime.UtcNow;
        var expiredTime = now.AddHours(-1); // Expired 1 hour ago
        var notBefore = expiredTime.AddHours(-1); // Not before 2 hours ago
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim("level", user.Level.ToString()),
                new Claim("experience", user.ExperiencePoints.ToString())
            }),
            NotBefore = notBefore,
            Expires = expiredTime,
            Issuer = TestIssuer,
            Audience = TestAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public static string GenerateInvalidJwtToken()
    {
        return "invalid.jwt.token";
    }

    public static async Task<string> LoginAndGetTokenAsync(HttpClient client, string email, string password)
    {
        var loginRequest = new
        {
            Email = email,
            Password = password
        };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Login failed with status: {response.StatusCode}");
        }

        var loginResponse = await response.Content.ReadFromJsonAsync<LoginResponse>();
        return loginResponse?.AccessToken ?? throw new InvalidOperationException("No access token received");
    }

    public static void AddAuthorizationHeader(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }

    public static void RemoveAuthorizationHeader(HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = null;
    }

    private class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
}
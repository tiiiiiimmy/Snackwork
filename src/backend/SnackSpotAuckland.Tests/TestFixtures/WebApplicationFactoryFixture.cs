using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Services;
using SnackSpotAuckland.Api.Middleware;

namespace SnackSpotAuckland.Tests.TestFixtures;

public class WebApplicationFactoryFixture : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"TestDb_{Guid.NewGuid()}";
    
    // Use the exact same JWT key as TestAuthHelper
    private const string TestJwtKey = "test-super-secret-key-at-least-256-bits-long-for-security-testing-purposes";
    private const string TestIssuer = "SnackSpotAuckland.Tests";
    private const string TestAudience = "SnackSpotAuckland.Tests";
    
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        
        // Configure test-specific settings
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = TestJwtKey,
                ["Jwt:Issuer"] = TestIssuer,
                ["Jwt:Audience"] = TestAudience,
                ["Jwt:AccessTokenExpiryMinutes"] = "60",
                ["Jwt:RefreshTokenExpiryDays"] = "30",
                // Disable rate limiting for tests
                ["RateLimit:Enabled"] = "false"
            });
        });
        
        builder.ConfigureServices(services =>
        {
            // Remove ALL Entity Framework related services
            var efDescriptors = services.Where(d =>
                d.ServiceType.FullName?.Contains("EntityFramework") == true ||
                d.ServiceType.FullName?.Contains("Npgsql") == true ||
                d.ImplementationType?.FullName?.Contains("EntityFramework") == true ||
                d.ImplementationType?.FullName?.Contains("Npgsql") == true ||
                d.ServiceType == typeof(DbContextOptions) ||
                d.ServiceType == typeof(DbContextOptions<SnackSpotDbContext>) ||
                d.ServiceType == typeof(SnackSpotDbContext)
            ).ToList();

            foreach (var descriptor in efDescriptors)
            {
                services.Remove(descriptor);
            }

            // Add fresh in-memory database
            services.AddDbContext<SnackSpotDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            // Ensure other required services are registered
            services.AddScoped<IAuthService, AuthService>();
            
            // Remove existing JWT authentication configuration and re-add with correct settings
            var jwtDescriptors = services.Where(d =>
                d.ServiceType.FullName?.Contains("JwtBearer") == true ||
                d.ServiceType.FullName?.Contains("Authentication") == true ||
                d.ImplementationType?.FullName?.Contains("JwtBearer") == true
            ).ToList();

            foreach (var descriptor in jwtDescriptors)
            {
                services.Remove(descriptor);
            }

            // Re-add JWT authentication with exact test configuration
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = TestIssuer,
                        ValidAudience = TestAudience,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestJwtKey)),
                        ClockSkew = TimeSpan.Zero
                    };
                });

            services.AddAuthorization();

            // Disable rate limiting for tests
            services.Configure<RateLimitOptions>(options =>
            {
                options.EnableRateLimiting = false;
                options.EnableIpRateLimiting = false;
                options.EnableUserRateLimiting = false;
            });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        
        // Seed test data
        using var scope = host.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
        context.Database.EnsureCreated();
        SeedTestData(context);
        
        return host;
    }

    private void SeedTestData(SnackSpotDbContext context)
    {
        if (!context.Categories.Any())
        {
            var categories = new[]
            {
                new SnackSpotAuckland.Api.Models.Category 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Sweet", 
                    Description = "Sweet snacks and treats",
                    CreatedAt = DateTime.UtcNow
                },
                new SnackSpotAuckland.Api.Models.Category 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Savory", 
                    Description = "Savory snacks and meals",
                    CreatedAt = DateTime.UtcNow
                },
                new SnackSpotAuckland.Api.Models.Category 
                { 
                    Id = Guid.NewGuid(), 
                    Name = "Healthy", 
                    Description = "Healthy and nutritious options",
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.Categories.AddRange(categories);
            context.SaveChanges();
        }
    }
}
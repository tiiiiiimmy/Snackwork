using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SnackSpotAuckland.Api.Data;

namespace SnackSpotAuckland.Tests.TestFixtures;

public class WebApplicationFactoryFixture : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the app's DbContext registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<SnackSpotDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add DbContext using in-memory database for testing
            services.AddDbContext<SnackSpotDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestDatabase");
                options.UseNetTopologySuite(); // For spatial data support
            });

            // Disable logging during tests
            services.AddLogging(builder => builder.SetMinimumLevel(LogLevel.Warning));

            // Build the service provider
            var serviceProvider = services.BuildServiceProvider();

            // Create a scope to obtain a reference to the database context
            using var scope = serviceProvider.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var context = scopedServices.GetRequiredService<SnackSpotDbContext>();

            // Ensure the database is created
            context.Database.EnsureCreated();

            // Seed test data if needed
            SeedTestData(context);
        });

        builder.UseEnvironment("Testing");
    }

    private void SeedTestData(SnackSpotDbContext context)
    {
        // Add any common test data here
        if (!context.Categories.Any())
        {
            var categories = new[]
            {
                new SnackSpotAuckland.Api.Models.Category { Id = Guid.NewGuid(), Name = "Sweet", Description = "Sweet snacks and treats" },
                new SnackSpotAuckland.Api.Models.Category { Id = Guid.NewGuid(), Name = "Savory", Description = "Savory snacks and meals" },
                new SnackSpotAuckland.Api.Models.Category { Id = Guid.NewGuid(), Name = "Healthy", Description = "Healthy and nutritious options" }
            };

            context.Categories.AddRange(categories);
            context.SaveChanges();
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
            context.Database.EnsureDeleted();
        }
        base.Dispose(disposing);
    }
}
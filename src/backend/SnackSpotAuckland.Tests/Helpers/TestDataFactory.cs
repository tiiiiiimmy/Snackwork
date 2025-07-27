using Bogus;
using NetTopologySuite.Geometries;
using SnackSpotAuckland.Api.Models;

namespace SnackSpotAuckland.Tests.Helpers;

public static class TestDataFactory
{
    private static readonly Faker Faker = new();

    public static User CreateUser(string? username = null, string? email = null)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Username = username ?? Faker.Internet.UserName(),
            Email = (email ?? Faker.Internet.Email()).ToLower(), // Store email in lowercase like AuthService does
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("TestPassword123!"),
            Level = Faker.Random.Int(1, 5),
            ExperiencePoints = Faker.Random.Int(0, 1000),
            Location = null, // Avoid spatial data issues in in-memory database
            CreatedAt = DateTime.UtcNow.AddDays(-Faker.Random.Int(1, 365)),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Category CreateCategory(string? name = null, string? description = null)
    {
        return new Category
        {
            Id = Guid.NewGuid(),
            Name = name ?? Faker.Commerce.Categories(1)[0],
            Description = description ?? Faker.Lorem.Sentence(),
            CreatedAt = DateTime.UtcNow.AddDays(-Faker.Random.Int(1, 30)),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Snack CreateSnack(Guid? userId = null, Guid? categoryId = null, string? name = null)
    {
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        var testPoint = geometryFactory.CreatePoint(new Coordinate(174.7633, -36.8485)); // Auckland coordinates
        
        return new Snack
        {
            Id = Guid.NewGuid(),
            Name = name ?? Faker.Commerce.ProductName(),
            Description = Faker.Lorem.Paragraph(),
            UserId = userId ?? Guid.NewGuid(),
            CategoryId = categoryId ?? Guid.NewGuid(),
            StoreId = Guid.NewGuid(), // Link to a store instead of direct shop info
            // Location removed as it's now derived from Store
            Image = null, // Images are now stored as byte arrays
            AverageRating = Faker.Random.Decimal(1, 5),
            TotalRatings = Faker.Random.Int(0, 100),
            DataSource = Faker.PickRandom<DataSource>(),
            CreatedAt = DateTime.UtcNow.AddDays(-Faker.Random.Int(1, 90))
        };
    }

    public static Store CreateStore(Guid? createdByUserId = null, string? name = null)
    {
        return new Store
        {
            Id = Guid.NewGuid(),
            Name = name ?? Faker.Company.CompanyName(),
            Address = Faker.Address.FullAddress(),
            Latitude = (decimal)Faker.Random.Double(-37.0, -36.7), // Auckland latitude range
            Longitude = (decimal)Faker.Random.Double(174.6, 175.0), // Auckland longitude range
            CreatedByUserId = createdByUserId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow.AddDays(-Faker.Random.Int(1, 30))
        };
    }

    public static Review CreateReview(Guid? userId = null, Guid? snackId = null, int? rating = null)
    {
        return new Review
        {
            Id = Guid.NewGuid(),
            UserId = userId ?? Guid.NewGuid(),
            SnackId = snackId ?? Guid.NewGuid(),
            Rating = rating ?? Faker.Random.Int(1, 5),
            Comment = Faker.Lorem.Paragraph(),
            CreatedAt = DateTime.UtcNow.AddDays(-Faker.Random.Int(1, 60)),
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static RefreshToken CreateRefreshToken(Guid userId)
    {
        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = Guid.NewGuid().ToString(),
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            IsRevoked = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Point CreateAucklandPoint()
    {
        // Auckland coordinates: roughly between -36.7 to -37.0 latitude and 174.6 to 175.0 longitude
        var lat = Faker.Random.Double(-37.0, -36.7);
        var lng = Faker.Random.Double(174.6, 175.0);
        
        var geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        return geometryFactory.CreatePoint(new Coordinate(lng, lat));
    }

    public static class AuthData
    {
        public static string ValidJwtToken => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJqdGkiOiJ0ZXN0LWlkIiwiaWF0IjoxNTE2MjM5MDIyfQ.test-signature";
        
        public static class LoginRequest
        {
            public static object Valid => new { Email = "testuser@example.com", Password = "TestPassword123!" };
            public static object InvalidEmail => new { Email = "", Password = "TestPassword123!" };
            public static object InvalidPassword => new { Email = "testuser@example.com", Password = "123" };
            public static object WrongCredentials => new { Email = "testuser@example.com", Password = "WrongPassword123!" };
        }

        public static class RegisterRequest
        {
            public static object Valid => new { Username = "newuser", Email = "newuser@test.com", Password = "TestPassword123!" };
            public static object DuplicateUsername => new { Username = "testuser", Email = "different@test.com", Password = "TestPassword123!" };
            public static object DuplicateEmail => new { Username = "differentuser", Email = "testuser@test.com", Password = "TestPassword123!" };
            public static object InvalidEmail => new { Username = "newuser", Email = "invalid-email", Password = "TestPassword123!" };
            public static object WeakPassword => new { Username = "newuser", Email = "newuser@test.com", Password = "123" };
        }
    }

    public static class SnackData
    {
        public static object ValidCreateRequest => new
        {
            Name = "Test Snack",
            Description = "A delicious test snack",
            CategoryId = Guid.NewGuid(),
            Location = new { Lat = -36.8485, Lng = 174.7633 },
            ShopName = "Test Shop",
            ShopAddress = "123 Test Street, Auckland"
        };

        public static object InvalidCreateRequest => new
        {
            Name = "", // Invalid: empty name
            Description = "A test snack",
            CategoryId = Guid.NewGuid(),
            Location = new { Lat = -36.8485, Lng = 174.7633 }
        };

        public static object ValidUpdateRequest => new
        {
            Name = "Updated Test Snack",
            Description = "An updated test snack description",
            ShopName = "Updated Test Shop"
        };
    }

    public static class ReviewData
    {
        public static object ValidCreateRequest => new
        {
            SnackId = Guid.NewGuid(),
            Rating = 4,
            Comment = "Great snack, really enjoyed it!"
        };

        public static object InvalidRatingRequest => new
        {
            SnackId = Guid.NewGuid(),
            Rating = 6, // Invalid: rating should be 1-5
            Comment = "Invalid rating test"
        };

        public static object ValidUpdateRequest => new
        {
            Rating = 5,
            Comment = "Updated review - absolutely fantastic!"
        };
    }

    public static class QueryParams
    {
        public static class NearbySnacks
        {
            public static string Valid => "?lat=-36.8485&lng=174.7633&radius=1000";
            public static string InvalidLatitude => "?lat=invalid&lng=174.7633&radius=1000";
            public static string MissingParameters => "?lat=-36.8485";
            public static string InvalidRadius => "?lat=-36.8485&lng=174.7633&radius=-1000";
        }
    }
}
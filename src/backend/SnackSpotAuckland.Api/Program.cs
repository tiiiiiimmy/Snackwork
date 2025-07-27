using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Reflection;
using Microsoft.OpenApi.Models;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Services;
using SnackSpotAuckland.Api.Middleware;
using SnackSpotAuckland.Api.Filters;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "SnackSpot Auckland API",
        Version = "v1",
        Description = "A gamified, community-driven API for discovering and sharing snacks in Auckland, New Zealand",
        Contact = new()
        {
            Name = "SnackSpot Auckland Team",
            Email = "team@snackspot.nz"
        },
        License = new()
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // Add JWT Authentication to Swagger
    options.AddSecurityDefinition("Bearer", new()
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT token in the format: your-token-here"
    });

    options.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new()
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments for better documentation
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Add operation filters for better documentation
    options.OperationFilter<SwaggerOperationFilter>();
});

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();

// Configure middleware options
builder.Services.Configure<RateLimitOptions>(options =>
{
    options.EnableRateLimiting = true;
    options.EnableIpRateLimiting = true;
    options.EnableUserRateLimiting = true;
});

builder.Services.Configure<InputValidationOptions>(options =>
{
    options.MaxRequestBodySize = 1024 * 1024; // 1MB
    options.MaxParameterNameLength = 100;
    options.MaxParameterValueLength = 1000;
    options.MaxHeaderNameLength = 100;
    options.MaxHeaderValueLength = 1000;
    options.MaxJsonObjectSize = 512 * 1024; // 512KB
    options.MaxJsonPropertyNameLength = 100;
    options.MaxJsonStringLength = 10000;
    options.MaxJsonArrayLength = 1000;
});

builder.Services.Configure<SecurityHeadersOptions>(options =>
{
    options.ContentSecurityPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com; frame-src 'none'; object-src 'none';";
    options.XFrameOptions = "DENY";
    options.ReferrerPolicy = "strict-origin-when-cross-origin";
    options.EnableHsts = true;
    options.HstsMaxAge = 31536000;
    options.PermissionsPolicy = "geolocation=self, microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=self";
    options.RemoveServerHeader = true;
});

builder.Services.Configure<RequestLoggingOptions>(options =>
{
    options.LogRequestBody = builder.Environment.IsDevelopment();
    options.LogResponseBody = builder.Environment.IsDevelopment();
    options.LogHeaders = builder.Environment.IsDevelopment();
    options.MaxLoggedBodyLength = 1000;
});

// Configure Entity Framework with PostgreSQL
builder.Services.AddDbContext<SnackSpotDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "your-super-secret-key-at-least-256-bits-long-for-security";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SnackSpotAuckland";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SnackSpotAuckland";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://localhost:3000", "https://localhost:5173", "https://localhost:5174")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

var app = builder.Build();

// Apply database migrations in production
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SnackSpotDbContext>();
    try
    {
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database");
        throw;
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Security middleware - order is important
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

// Input validation after auth so that auth errors (401/403) are returned before validation errors (400)
app.UseMiddleware<InputValidationMiddleware>();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// Make Program class accessible for testing
public partial class Program { }

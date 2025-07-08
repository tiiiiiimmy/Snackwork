using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Services;
using SnackSpotAuckland.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// Configure Entity Framework with PostgreSQL and PostGIS
builder.Services.AddDbContext<SnackSpotDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.UseNetTopologySuite()
    )
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
app.UseMiddleware<InputValidationMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// Make Program class accessible for testing
public partial class Program { }

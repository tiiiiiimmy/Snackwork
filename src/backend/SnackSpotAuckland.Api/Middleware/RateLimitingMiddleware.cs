using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace SnackSpotAuckland.Api.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly RateLimitOptions _options;
    private readonly ConcurrentDictionary<string, RateLimitInfo> _clients;
    private readonly Timer _cleanupTimer;

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, IOptions<RateLimitOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
        _clients = new ConcurrentDictionary<string, RateLimitInfo>();

        // Cleanup expired entries every minute
        _cleanupTimer = new Timer(CleanupExpiredEntries, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip rate limiting if disabled
        if (!_options.EnableRateLimiting)
        {
            await _next(context);
            return;
        }

        var clientId = GetClientId(context);
        var endpoint = GetEndpoint(context);

        // Get rate limit configuration for this endpoint
        var rateLimitConfig = GetRateLimitConfig(endpoint, context.Request.Method);

        if (rateLimitConfig == null)
        {
            await _next(context);
            return;
        }

        var now = DateTime.UtcNow;
        var key = $"{clientId}:{endpoint}:{context.Request.Method}";

        var rateLimitInfo = _clients.GetOrAdd(key, _ => new RateLimitInfo
        {
            RequestCount = 0,
            WindowStart = now
        });

        bool isRateLimited = false;
        int requestCount = 0;
        DateTime windowStart = DateTime.UtcNow;

        lock (rateLimitInfo)
        {
            // Reset window if expired
            if (now - rateLimitInfo.WindowStart > rateLimitConfig.Window)
            {
                rateLimitInfo.RequestCount = 0;
                rateLimitInfo.WindowStart = now;
            }

            // Check if rate limit exceeded
            if (rateLimitInfo.RequestCount >= rateLimitConfig.MaxRequests)
            {
                isRateLimited = true;
            }
            else
            {
                // Increment request count
                rateLimitInfo.RequestCount++;
            }

            requestCount = rateLimitInfo.RequestCount;
            windowStart = rateLimitInfo.WindowStart;
        }

        // Handle rate limiting outside of lock
        if (isRateLimited)
        {
            _logger.LogWarning("Rate limit exceeded for client {ClientId} on endpoint {Endpoint}", clientId, endpoint);

            var resetTimeExceeded = windowStart.Add(rateLimitConfig.Window);
            var retryAfter = (int)(resetTimeExceeded - now).TotalSeconds;

            var errorResponse = new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.TooManyRequests,
                Message = "Rate limit exceeded",
                Timestamp = now,
                Path = context.Request.Path,
                Details = new Dictionary<string, object>
                {
                    { "retryAfter", retryAfter },
                    { "limit", rateLimitConfig.MaxRequests },
                    { "window", rateLimitConfig.Window.TotalSeconds }
                }
            };

            var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
            context.Response.ContentType = "application/json";
            context.Response.Headers["Retry-After"] = retryAfter.ToString();
            context.Response.Headers["X-RateLimit-Limit"] = rateLimitConfig.MaxRequests.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = "0";
            context.Response.Headers["X-RateLimit-Reset"] = ((DateTimeOffset)resetTimeExceeded).ToUnixTimeSeconds().ToString();

            await context.Response.WriteAsync(jsonResponse);
            return;
        }

        // Add rate limit headers for successful requests
        var remaining = rateLimitConfig.MaxRequests - requestCount;
        var resetTimeNormal = windowStart.Add(rateLimitConfig.Window);

        context.Response.Headers["X-RateLimit-Limit"] = rateLimitConfig.MaxRequests.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = remaining.ToString();
        context.Response.Headers["X-RateLimit-Reset"] = ((DateTimeOffset)resetTimeNormal).ToUnixTimeSeconds().ToString();

        await _next(context);
    }

    private string GetClientId(HttpContext context)
    {
        // Try to get user ID from JWT token first
        var userId = context.User.FindFirst("sub")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user:{userId}";
        }

        // Fall back to IP address
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        if (!string.IsNullOrEmpty(ipAddress))
        {
            return $"ip:{ipAddress}";
        }

        return "unknown";
    }

    private string GetEndpoint(HttpContext context)
    {
        return context.Request.Path.ToString().ToLowerInvariant();
    }

    private RateLimitConfig? GetRateLimitConfig(string endpoint, string method)
    {
        // Define rate limits for different endpoints
        var rateLimits = new Dictionary<string, RateLimitConfig>
        {
            // Authentication endpoints - stricter limits
            { "POST:/api/v1/auth/login", new RateLimitConfig(5, TimeSpan.FromMinutes(1)) },
            { "POST:/api/v1/auth/register", new RateLimitConfig(3, TimeSpan.FromMinutes(1)) },
            { "POST:/api/v1/auth/refresh", new RateLimitConfig(10, TimeSpan.FromMinutes(1)) },
            
            // Snack creation/modification - moderate limits
            { "POST:/api/v1/snacks", new RateLimitConfig(20, TimeSpan.FromMinutes(1)) },
            { "PUT:/api/v1/snacks/*", new RateLimitConfig(30, TimeSpan.FromMinutes(1)) },
            { "DELETE:/api/v1/snacks/*", new RateLimitConfig(10, TimeSpan.FromMinutes(1)) },
            
            // Review creation - moderate limits
            { "POST:/api/v1/reviews", new RateLimitConfig(30, TimeSpan.FromMinutes(1)) },
            
            // General API endpoints - generous limits
            { "GET:/api/v1/snacks", new RateLimitConfig(100, TimeSpan.FromMinutes(1)) },
            { "GET:/api/v1/categories", new RateLimitConfig(50, TimeSpan.FromMinutes(1)) },
            { "GET:/api/v1/users/*", new RateLimitConfig(60, TimeSpan.FromMinutes(1)) },
            
            // Default fallback
            { "default", new RateLimitConfig(100, TimeSpan.FromMinutes(1)) }
        };

        var key = $"{method}:{endpoint}";

        // Try exact match first
        if (rateLimits.TryGetValue(key, out var config))
        {
            return config;
        }

        // Try wildcard matches
        foreach (var kvp in rateLimits)
        {
            if (kvp.Key.EndsWith("/*") && key.StartsWith(kvp.Key[..^1]))
            {
                return kvp.Value;
            }
        }

        // Return default
        return rateLimits["default"];
    }

    private void CleanupExpiredEntries(object? state)
    {
        var now = DateTime.UtcNow;
        var expiredKeys = new List<string>();

        foreach (var kvp in _clients)
        {
            var rateLimitInfo = kvp.Value;
            lock (rateLimitInfo)
            {
                if (now - rateLimitInfo.WindowStart > TimeSpan.FromMinutes(5)) // Clean up entries older than 5 minutes
                {
                    expiredKeys.Add(kvp.Key);
                }
            }
        }

        foreach (var key in expiredKeys)
        {
            _clients.TryRemove(key, out _);
        }

        if (expiredKeys.Count > 0)
        {
            _logger.LogDebug("Cleaned up {Count} expired rate limit entries", expiredKeys.Count);
        }
    }
}

public class RateLimitInfo
{
    public int RequestCount { get; set; }
    public DateTime WindowStart { get; set; }
}

public class RateLimitConfig
{
    public int MaxRequests { get; }
    public TimeSpan Window { get; }

    public RateLimitConfig(int maxRequests, TimeSpan window)
    {
        MaxRequests = maxRequests;
        Window = window;
    }
}

public class RateLimitOptions
{
    public bool EnableRateLimiting { get; set; } = true;
    public bool EnableIpRateLimiting { get; set; } = true;
    public bool EnableUserRateLimiting { get; set; } = true;
}
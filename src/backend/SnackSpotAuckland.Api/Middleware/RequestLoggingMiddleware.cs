using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;

namespace SnackSpotAuckland.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private readonly RequestLoggingOptions _options;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger, IOptions<RequestLoggingOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ShouldLog(context.Request))
        {
            await _next(context);
            return;
        }

        var stopwatch = Stopwatch.StartNew();
        var requestId = Guid.NewGuid().ToString("N")[..8];

        // Add request ID to context
        context.Items["RequestId"] = requestId;

        try
        {
            // Log request
            await LogRequest(context, requestId);

            // Capture response
            var originalResponseBody = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            await _next(context);

            // Log response
            stopwatch.Stop();
            await LogResponse(context, requestId, responseBody, stopwatch.ElapsedMilliseconds);

            // Copy response back
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalResponseBody);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Request {RequestId} failed after {ElapsedMs}ms", requestId, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    private bool ShouldLog(HttpRequest request)
    {
        // Skip logging for certain paths
        var skipPaths = new[]
        {
            "/health",
            "/swagger",
            "/favicon.ico"
        };

        return !skipPaths.Any(path => request.Path.Value?.StartsWith(path, StringComparison.OrdinalIgnoreCase) == true);
    }

    private async Task LogRequest(HttpContext context, string requestId)
    {
        var request = context.Request;
        var requestInfo = new
        {
            RequestId = requestId,
            Method = request.Method,
            Path = request.Path.Value,
            QueryString = request.QueryString.Value,
            Headers = GetSafeHeaders(request.Headers),
            RemoteIp = GetClientIpAddress(context),
            UserAgent = request.Headers["User-Agent"].FirstOrDefault(),
            UserId = context.User.Identity?.Name,
            Timestamp = DateTime.UtcNow
        };

        _logger.LogInformation("Request {RequestId}: {Method} {Path} from {RemoteIp}",
            requestId, request.Method, request.Path, GetClientIpAddress(context));

        if (_options.LogRequestBody && HasRequestBody(request))
        {
            var requestBody = await ReadRequestBody(request);
            if (!string.IsNullOrEmpty(requestBody))
            {
                var sanitizedBody = SanitizeRequestBody(requestBody);
                _logger.LogDebug("Request {RequestId} Body: {RequestBody}", requestId, sanitizedBody);
            }
        }

        if (_options.LogHeaders)
        {
            _logger.LogDebug("Request {RequestId} Headers: {Headers}", requestId, JsonSerializer.Serialize(requestInfo.Headers));
        }
    }

    private async Task LogResponse(HttpContext context, string requestId, MemoryStream responseBody, long elapsedMs)
    {
        var response = context.Response;
        var responseInfo = new
        {
            RequestId = requestId,
            StatusCode = response.StatusCode,
            ContentType = response.ContentType,
            ContentLength = response.ContentLength ?? responseBody.Length,
            ElapsedMs = elapsedMs,
            Timestamp = DateTime.UtcNow
        };

        var logLevel = GetLogLevel(response.StatusCode);
        _logger.Log(logLevel, "Response {RequestId}: {StatusCode} in {ElapsedMs}ms",
            requestId, response.StatusCode, elapsedMs);

        if (_options.LogResponseBody && responseBody.Length > 0)
        {
            responseBody.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(responseBody, Encoding.UTF8, leaveOpen: true);
            var responseContent = await reader.ReadToEndAsync();

            if (!string.IsNullOrEmpty(responseContent))
            {
                var sanitizedResponse = SanitizeResponseBody(responseContent);
                _logger.LogDebug("Response {RequestId} Body: {ResponseBody}", requestId, sanitizedResponse);
            }
        }

        if (_options.LogHeaders)
        {
            var responseHeaders = GetSafeHeaders(response.Headers);
            _logger.LogDebug("Response {RequestId} Headers: {Headers}", requestId, JsonSerializer.Serialize(responseHeaders));
        }
    }

    private LogLevel GetLogLevel(int statusCode)
    {
        return statusCode switch
        {
            >= 500 => LogLevel.Error,
            >= 400 => LogLevel.Warning,
            _ => LogLevel.Information
        };
    }

    private bool HasRequestBody(HttpRequest request)
    {
        return request.ContentLength > 0 || request.Headers.ContainsKey("Transfer-Encoding");
    }

    private async Task<string> ReadRequestBody(HttpRequest request)
    {
        request.EnableBuffering();
        request.Body.Position = 0;

        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();

        request.Body.Position = 0;
        return body;
    }

    private string GetClientIpAddress(HttpContext context)
    {
        // Check for forwarded headers first
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private Dictionary<string, string> GetSafeHeaders(IHeaderDictionary headers)
    {
        var safeHeaders = new Dictionary<string, string>();
        var sensitiveHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Authorization", "Cookie", "X-Api-Key", "X-Auth-Token", "Authentication"
        };

        foreach (var header in headers)
        {
            if (sensitiveHeaders.Contains(header.Key))
            {
                safeHeaders[header.Key] = "[REDACTED]";
            }
            else
            {
                safeHeaders[header.Key] = header.Value.ToString();
            }
        }

        return safeHeaders;
    }

    private string SanitizeRequestBody(string body)
    {
        if (string.IsNullOrEmpty(body))
            return body;

        // Remove sensitive data patterns
        var patterns = new Dictionary<string, string>
        {
            { @"""password"":\s*""[^""]*""", @"""password"": ""[REDACTED]""" },
            { @"""token"":\s*""[^""]*""", @"""token"": ""[REDACTED]""" },
            { @"""secret"":\s*""[^""]*""", @"""secret"": ""[REDACTED]""" },
            { @"""key"":\s*""[^""]*""", @"""key"": ""[REDACTED]""" },
            { @"""apiKey"":\s*""[^""]*""", @"""apiKey"": ""[REDACTED]""" },
            { @"""refreshToken"":\s*""[^""]*""", @"""refreshToken"": ""[REDACTED]""" }
        };

        var sanitized = body;
        foreach (var pattern in patterns)
        {
            sanitized = Regex.Replace(sanitized, pattern.Key, pattern.Value, RegexOptions.IgnoreCase);
        }

        // Truncate if too long
        if (sanitized.Length > _options.MaxLoggedBodyLength)
        {
            sanitized = sanitized[.._options.MaxLoggedBodyLength] + "... [TRUNCATED]";
        }

        return sanitized;
    }

    private string SanitizeResponseBody(string body)
    {
        if (string.IsNullOrEmpty(body))
            return body;

        // Remove sensitive data from responses
        var patterns = new Dictionary<string, string>
        {
            { @"""accessToken"":\s*""[^""]*""", @"""accessToken"": ""[REDACTED]""" },
            { @"""refreshToken"":\s*""[^""]*""", @"""refreshToken"": ""[REDACTED]""" },
            { @"""token"":\s*""[^""]*""", @"""token"": ""[REDACTED]""" }
        };

        var sanitized = body;
        foreach (var pattern in patterns)
        {
            sanitized = Regex.Replace(sanitized, pattern.Key, pattern.Value, RegexOptions.IgnoreCase);
        }

        // Truncate if too long
        if (sanitized.Length > _options.MaxLoggedBodyLength)
        {
            sanitized = sanitized[.._options.MaxLoggedBodyLength] + "... [TRUNCATED]";
        }

        return sanitized;
    }
}

public class RequestLoggingOptions
{
    public bool LogRequestBody { get; set; } = true;
    public bool LogResponseBody { get; set; } = true;
    public bool LogHeaders { get; set; } = false;
    public int MaxLoggedBodyLength { get; set; } = 1000;
}
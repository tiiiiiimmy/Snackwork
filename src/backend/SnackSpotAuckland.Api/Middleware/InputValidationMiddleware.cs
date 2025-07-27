using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace SnackSpotAuckland.Api.Middleware;

public class InputValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputValidationMiddleware> _logger;
    private readonly InputValidationOptions _options;

    public InputValidationMiddleware(RequestDelegate next, ILogger<InputValidationMiddleware> logger, IOptions<InputValidationOptions> options)
    {
        _next = next;
        _logger = logger;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Always validate query parameters and headers for all requests
            var queryValidationResult = ValidateQueryParameters(context.Request.Query);
            if (!queryValidationResult.IsValid)
            {
                await WriteValidationErrorResponse(context, queryValidationResult);
                return;
            }

            // Validate headers
            var headerValidationResult = ValidateHeaders(context.Request.Headers);
            if (!headerValidationResult.IsValid)
            {
                await WriteValidationErrorResponse(context, headerValidationResult);
                return;
            }

            // Only validate request body for POST, PUT, PATCH requests with content
            if (ShouldValidateRequestBody(context.Request))
            {
                // Enable buffering to allow reading the request body multiple times
                context.Request.EnableBuffering();

                // Read and validate request body
                var requestBody = await ReadRequestBodyAsync(context.Request);

                if (!string.IsNullOrEmpty(requestBody))
                {
                    var validationResult = ValidateRequestBody(requestBody, context.Request.Path);

                    if (!validationResult.IsValid)
                    {
                        await WriteValidationErrorResponse(context, validationResult);
                        return;
                    }
                }

                // Reset stream position for downstream middleware
                context.Request.Body.Position = 0;
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during input validation");
            await WriteValidationErrorResponse(context, new ValidationResult
            {
                IsValid = false,
                Errors = new Dictionary<string, object> { { "general", "Invalid request format" } }
            });
        }
    }

    private bool ShouldValidateRequestBody(HttpRequest request)
    {
        var method = request.Method.ToUpperInvariant();
        return method is "POST" or "PUT" or "PATCH" && request.ContentLength > 0;
    }

    private async Task<string> ReadRequestBodyAsync(HttpRequest request)
    {
        using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }

    private ValidationResult ValidateRequestBody(string requestBody, string path)
    {
        var errors = new Dictionary<string, object>();

        // Check request body size
        if (requestBody.Length > _options.MaxRequestBodySize)
        {
            errors.Add("requestBody", $"Request body size exceeds maximum allowed size of {_options.MaxRequestBodySize} bytes");
        }

        // Check for potentially malicious patterns
        if (ContainsMaliciousPatterns(requestBody))
        {
            errors.Add("requestBody", "Request contains potentially malicious content");
            _logger.LogWarning("Malicious content detected in request body for path: {Path}", path);
        }

        // Validate JSON structure if content type is JSON
        if (requestBody.Trim().StartsWith('{') || requestBody.Trim().StartsWith('['))
        {
            try
            {
                var document = JsonDocument.Parse(requestBody);
                var jsonErrors = ValidateJsonStructure(document.RootElement);
                foreach (var error in jsonErrors)
                {
                    errors.Add(error.Key, error.Value);
                }
            }
            catch (JsonException ex)
            {
                errors.Add("json", $"Invalid JSON format: {ex.Message}");
            }
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    private ValidationResult ValidateQueryParameters(IQueryCollection queryParams)
    {
        var errors = new Dictionary<string, object>();

        foreach (var param in queryParams)
        {
            // Check parameter name
            if (param.Key.Length > _options.MaxParameterNameLength)
            {
                errors.Add($"queryParam.{param.Key}", $"Parameter name exceeds maximum length of {_options.MaxParameterNameLength}");
            }

            // Check for malicious patterns in parameter names
            if (ContainsMaliciousPatterns(param.Key))
            {
                errors.Add($"queryParam.{param.Key}", "Parameter name contains potentially malicious content");
                _logger.LogWarning("Malicious content detected in query parameter name: {ParamName}", param.Key);
            }

            // Check parameter values
            foreach (var value in param.Value)
            {
                if (value != null)
                {
                    if (value.Length > _options.MaxParameterValueLength)
                    {
                        errors.Add($"queryParam.{param.Key}", $"Parameter value exceeds maximum length of {_options.MaxParameterValueLength}");
                    }

                    if (ContainsMaliciousPatterns(value))
                    {
                        errors.Add($"queryParam.{param.Key}", "Parameter value contains potentially malicious content");
                        _logger.LogWarning("Malicious content detected in query parameter value: {ParamName}={ParamValue}", param.Key, value);
                    }
                }
            }
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    private ValidationResult ValidateHeaders(IHeaderDictionary headers)
    {
        var errors = new Dictionary<string, object>();

        foreach (var header in headers)
        {
            // Skip validation for certain headers
            if (IsSystemHeader(header.Key))
                continue;

            // Check header name length
            if (header.Key.Length > _options.MaxHeaderNameLength)
            {
                errors.Add($"header.{header.Key}", $"Header name exceeds maximum length of {_options.MaxHeaderNameLength}");
            }

            // Check header values
            foreach (var value in header.Value)
            {
                if (value != null)
                {
                    if (value.Length > _options.MaxHeaderValueLength)
                    {
                        errors.Add($"header.{header.Key}", $"Header value exceeds maximum length of {_options.MaxHeaderValueLength}");
                    }

                    // Check for malicious patterns in custom headers
                    if (ContainsMaliciousPatterns(value) && !IsSystemHeader(header.Key))
                    {
                        errors.Add($"header.{header.Key}", "Header value contains potentially malicious content");
                        _logger.LogWarning("Malicious content detected in header: {HeaderName}={HeaderValue}", header.Key, value);
                    }
                }
            }
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    private Dictionary<string, object> ValidateJsonStructure(JsonElement element)
    {
        var errors = new Dictionary<string, object>();

        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.GetRawText().Length > _options.MaxJsonObjectSize)
                {
                    errors.Add("json.object", $"JSON object size exceeds maximum allowed size of {_options.MaxJsonObjectSize} bytes");
                }

                foreach (var property in element.EnumerateObject())
                {
                    // Validate property name
                    if (property.Name.Length > _options.MaxJsonPropertyNameLength)
                    {
                        errors.Add($"json.{property.Name}", $"Property name exceeds maximum length of {_options.MaxJsonPropertyNameLength}");
                    }

                    if (ContainsMaliciousPatterns(property.Name))
                    {
                        errors.Add($"json.{property.Name}", "Property name contains potentially malicious content");
                    }

                    // Recursively validate nested objects
                    var nestedErrors = ValidateJsonStructure(property.Value);
                    foreach (var error in nestedErrors)
                    {
                        errors.Add($"json.{property.Name}.{error.Key}", error.Value);
                    }
                }
                break;

            case JsonValueKind.Array:
                if (element.GetArrayLength() > _options.MaxJsonArrayLength)
                {
                    errors.Add("json.array", $"JSON array length exceeds maximum allowed length of {_options.MaxJsonArrayLength}");
                }

                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    var nestedErrors = ValidateJsonStructure(item);
                    foreach (var error in nestedErrors)
                    {
                        errors.Add($"json.array[{index}].{error.Key}", error.Value);
                    }
                    index++;
                }
                break;

            case JsonValueKind.String:
                var stringValue = element.GetString();
                if (stringValue != null)
                {
                    if (stringValue.Length > _options.MaxJsonStringLength)
                    {
                        errors.Add("json.string", $"JSON string length exceeds maximum allowed length of {_options.MaxJsonStringLength}");
                    }

                    if (ContainsMaliciousPatterns(stringValue))
                    {
                        errors.Add("json.string", "JSON string contains potentially malicious content");
                    }
                }
                break;
        }

        return errors;
    }

    private bool ContainsMaliciousPatterns(string input)
    {
        if (string.IsNullOrEmpty(input))
            return false;

        // SQL injection patterns
        var sqlPatterns = new[]
        {
            @"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|OR|AND)\b)",
            @"(--|#|/\*|\*/)",
            @"(\b(OR|AND)\s+\w+\s*=\s*\w+)",
            @"(\b(OR|AND)\s+\d+\s*=\s*\d+)",
            @"('\s*(OR|AND)\s*')",
            @"(\b(UNION|SELECT).*\b(FROM|WHERE)\b)"
        };

        // XSS patterns
        var xssPatterns = new[]
        {
            @"(<script[^>]*>.*?</script>)",
            @"(javascript:)",
            @"(on\w+\s*=)",
            @"(<iframe[^>]*>)",
            @"(<object[^>]*>)",
            @"(<embed[^>]*>)",
            @"(<form[^>]*>)",
            @"(eval\s*\()",
            @"(document\.(cookie|write|writeln))",
            @"(window\.(location|open))"
        };

        // Path traversal patterns
        var pathTraversalPatterns = new[]
        {
            @"(\.\./)",
            @"(\.\.\\)",
            @"(/etc/passwd)",
            @"(/proc/)",
            @"(\\windows\\)",
            @"(\\system32\\)"
        };

        // Command injection patterns
        var commandInjectionPatterns = new[]
        {
            @"(\b(cmd|powershell|sh|bash|zsh)\b)",
            @"(\||&|;|`|\$\()",
            @"(\b(wget|curl|nc|netcat|telnet)\b)"
        };

        var allPatterns = sqlPatterns.Concat(xssPatterns).Concat(pathTraversalPatterns).Concat(commandInjectionPatterns);

        foreach (var pattern in allPatterns)
        {
            if (Regex.IsMatch(input, pattern, RegexOptions.IgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private bool IsSystemHeader(string headerName)
    {
        var systemHeaders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Authorization", "Content-Type", "Content-Length", "User-Agent", "Accept", "Accept-Encoding",
            "Accept-Language", "Host", "Origin", "Referer", "Connection", "Cache-Control", "Cookie",
            "X-Requested-With", "X-Forwarded-For", "X-Real-IP", "X-Forwarded-Proto",
            // Browser security headers
            "Sec-CH-UA", "Sec-CH-UA-Mobile", "Sec-CH-UA-Platform", "Sec-Fetch-Site", "Sec-Fetch-Mode",
            "Sec-Fetch-User", "Sec-Fetch-Dest", "Upgrade-Insecure-Requests",
            // Additional standard headers
            "DNT", "Content-Encoding", "Transfer-Encoding", "TE", "Pragma", "Expires",
            "Last-Modified", "If-Modified-Since", "If-None-Match", "ETag", "Vary",
            // Azure App Service headers
            "X-ARR-SSL", "X-ARR-LOG-ID", "X-Site-Deployment-Id", "X-Original-URL", "X-Forwarded-Host",
            "X-Azure-FDID", "X-Azure-RequestId", "X-MS-CLIENT-PRINCIPAL", "X-MS-CLIENT-PRINCIPAL-NAME",
            "X-MS-CLIENT-PRINCIPAL-ID", "X-MS-CLIENT-PRINCIPAL-IDP"
        };

        return systemHeaders.Contains(headerName);
    }

    private async Task WriteValidationErrorResponse(HttpContext context, ValidationResult validationResult)
    {
        context.Response.StatusCode = 400;
        context.Response.ContentType = "application/json";

        var errorResponse = new ErrorResponse
        {
            StatusCode = 400,
            Message = "Input validation failed",
            Timestamp = DateTime.UtcNow,
            Path = context.Request.Path,
            Details = validationResult.Errors
        };

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public Dictionary<string, object> Errors { get; set; } = new();
}

public class InputValidationOptions
{
    public int MaxRequestBodySize { get; set; } = 1024 * 1024; // 1MB
    public int MaxParameterNameLength { get; set; } = 100;
    public int MaxParameterValueLength { get; set; } = 1000;
    public int MaxHeaderNameLength { get; set; } = 100;
    public int MaxHeaderValueLength { get; set; } = 1000;
    public int MaxJsonObjectSize { get; set; } = 512 * 1024; // 512KB
    public int MaxJsonPropertyNameLength { get; set; } = 100;
    public int MaxJsonStringLength { get; set; } = 10000;
    public int MaxJsonArrayLength { get; set; } = 1000;
}
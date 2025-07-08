namespace SnackSpotAuckland.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityHeadersMiddleware> _logger;
    private readonly SecurityHeadersOptions _options;

    public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger, SecurityHeadersOptions options)
    {
        _next = next;
        _logger = logger;
        _options = options;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers
        AddSecurityHeaders(context);

        await _next(context);
    }

    private void AddSecurityHeaders(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Content Security Policy
        if (!string.IsNullOrEmpty(_options.ContentSecurityPolicy))
        {
            headers["Content-Security-Policy"] = _options.ContentSecurityPolicy;
        }

        // X-Content-Type-Options
        headers["X-Content-Type-Options"] = "nosniff";

        // X-Frame-Options
        headers["X-Frame-Options"] = _options.XFrameOptions;

        // X-XSS-Protection
        headers["X-XSS-Protection"] = "1; mode=block";

        // Referrer-Policy
        headers["Referrer-Policy"] = _options.ReferrerPolicy;

        // Strict-Transport-Security (HSTS)
        if (_options.EnableHsts && context.Request.IsHttps)
        {
            headers["Strict-Transport-Security"] = $"max-age={_options.HstsMaxAge}; includeSubDomains";
        }

        // Permissions-Policy
        if (!string.IsNullOrEmpty(_options.PermissionsPolicy))
        {
            headers["Permissions-Policy"] = _options.PermissionsPolicy;
        }

        // Remove server header
        if (_options.RemoveServerHeader)
        {
            headers.Remove("Server");
        }

        // Remove X-Powered-By header
        headers.Remove("X-Powered-By");

        // Remove X-AspNet-Version header
        headers.Remove("X-AspNet-Version");

        // Remove X-AspNetMvc-Version header
        headers.Remove("X-AspNetMvc-Version");

        // Custom security headers
        foreach (var customHeader in _options.CustomHeaders)
        {
            headers[customHeader.Key] = customHeader.Value;
        }
    }
}

public class SecurityHeadersOptions
{
    public string ContentSecurityPolicy { get; set; } = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://maps.googleapis.com; frame-src 'none'; object-src 'none';";
    public string XFrameOptions { get; set; } = "DENY";
    public string ReferrerPolicy { get; set; } = "strict-origin-when-cross-origin";
    public bool EnableHsts { get; set; } = true;
    public int HstsMaxAge { get; set; } = 31536000; // 1 year
    public string PermissionsPolicy { get; set; } = "geolocation=self, microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), fullscreen=self";
    public bool RemoveServerHeader { get; set; } = true;
    public Dictionary<string, string> CustomHeaders { get; set; } = new();
}
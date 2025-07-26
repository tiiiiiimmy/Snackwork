using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SnackSpotAuckland.Api.Filters;

public class SwaggerOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Add custom headers for rate limiting info
        if (operation.Responses.ContainsKey("200"))
        {
            operation.Responses["200"].Headers ??= new Dictionary<string, OpenApiHeader>();

            operation.Responses["200"].Headers.Add("X-RateLimit-Limit", new OpenApiHeader
            {
                Description = "The number of allowed requests in the current period",
                Schema = new OpenApiSchema { Type = "integer" }
            });

            operation.Responses["200"].Headers.Add("X-RateLimit-Remaining", new OpenApiHeader
            {
                Description = "The number of remaining requests in the current period",
                Schema = new OpenApiSchema { Type = "integer" }
            });

            operation.Responses["200"].Headers.Add("X-RateLimit-Reset", new OpenApiHeader
            {
                Description = "The timestamp when the rate limit resets",
                Schema = new OpenApiSchema { Type = "integer", Format = "int64" }
            });
        }

        // Add common error responses
        if (!operation.Responses.ContainsKey("400"))
        {
            operation.Responses.Add("400", new OpenApiResponse
            {
                Description = "Bad Request - Invalid input data",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = new Dictionary<string, OpenApiSchema>
                            {
                                ["message"] = new OpenApiSchema { Type = "string" },
                                ["errors"] = new OpenApiSchema
                                {
                                    Type = "object",
                                    AdditionalProperties = new OpenApiSchema { Type = "array", Items = new OpenApiSchema { Type = "string" } }
                                }
                            }
                        }
                    }
                }
            });
        }

        if (!operation.Responses.ContainsKey("429"))
        {
            operation.Responses.Add("429", new OpenApiResponse
            {
                Description = "Too Many Requests - Rate limit exceeded",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = new Dictionary<string, OpenApiSchema>
                            {
                                ["message"] = new OpenApiSchema { Type = "string" },
                                ["retryAfter"] = new OpenApiSchema { Type = "integer" }
                            }
                        }
                    }
                }
            });
        }

        if (!operation.Responses.ContainsKey("500"))
        {
            operation.Responses.Add("500", new OpenApiResponse
            {
                Description = "Internal Server Error",
                Content = new Dictionary<string, OpenApiMediaType>
                {
                    ["application/json"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = new Dictionary<string, OpenApiSchema>
                            {
                                ["message"] = new OpenApiSchema { Type = "string" }
                            }
                        }
                    }
                }
            });
        }

        // Add authentication responses for protected endpoints
        if (context.MethodInfo.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false).Any() ||
            context.MethodInfo.DeclaringType?.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false).Any() == true)
        {
            if (!operation.Responses.ContainsKey("401"))
            {
                operation.Responses.Add("401", new OpenApiResponse
                {
                    Description = "Unauthorized - Invalid or missing authentication token"
                });
            }

            if (!operation.Responses.ContainsKey("403"))
            {
                operation.Responses.Add("403", new OpenApiResponse
                {
                    Description = "Forbidden - Insufficient permissions"
                });
            }
        }
    }
}
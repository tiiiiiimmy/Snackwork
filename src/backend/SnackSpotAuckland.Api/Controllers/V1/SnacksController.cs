using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using NetTopologySuite.Geometries;
using NetTopologySuite;

namespace SnackSpotAuckland.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class SnacksController : ControllerBase
{
    private readonly SnackSpotDbContext _context;
    private readonly ILogger<SnacksController> _logger;
    private static readonly GeometryFactory _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);

    public SnacksController(SnackSpotDbContext context, ILogger<SnacksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get snacks within a specified radius
    /// </summary>
    /// <param name="lat">Latitude</param>
    /// <param name="lng">Longitude</param>
    /// <param name="radius">Radius in meters (default: 1000)</param>
    /// <param name="categoryId">Optional category ID to filter snacks</param>
    /// <param name="search">Optional search term to filter by name or description</param>
    /// <returns>List of snacks within the specified radius</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<object>>> GetSnacks(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] int radius = 1000,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null)
    {
        try
        {
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            {
                return BadRequest(new { message = "Invalid latitude or longitude values" });
            }

            if (radius <= 0 || radius > 50000) // Max 50km radius
            {
                return BadRequest(new { message = "Radius must be between 1 and 50000 meters" });
            }

            var searchPoint = _geometryFactory.CreatePoint(new Coordinate(lng, lat));

            // Check if we're using an in-memory database (tests) or PostgreSQL (production)
            var isInMemoryDb = _context.Database.ProviderName == "Microsoft.EntityFrameworkCore.InMemory";
            
            IQueryable<Snack> query;
            
            if (isInMemoryDb)
            {
                // For in-memory database (tests), use simple filtering
                // Note: This is less accurate but works for testing
                var latRange = radius / 111000.0; // Rough conversion: 1 degree ≈ 111km
                var lngRange = radius / (111000.0 * Math.Cos(lat * Math.PI / 180));
                
                query = _context.Snacks
                    .Include(s => s.Category)
                    .Include(s => s.User)
                    .Where(s => Math.Abs(s.Location.Y - lat) <= latRange && 
                               Math.Abs(s.Location.X - lng) <= lngRange);
            }
            else
            {
                // For PostgreSQL with PostGIS, use proper geographic distance
                query = _context.Snacks
                    .FromSqlRaw(@"
                        SELECT s.* FROM ""Snacks"" s
                        WHERE ST_DWithin(s.""Location""::geography, ST_MakePoint({0}, {1})::geography, {2})
                    ", lng, lat, radius)
                    .Include(s => s.Category)
                    .Include(s => s.User);
            }

            // Filter by category if categoryId is provided
            if (categoryId.HasValue)
            {
                query = query.Where(s => s.CategoryId == categoryId.Value);
            }

            // Filter by search term if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s => 
                    s.Name.ToLower().Contains(searchLower) || 
                    (s.Description != null && s.Description.ToLower().Contains(searchLower)) ||
                    (s.ShopName != null && s.ShopName.ToLower().Contains(searchLower)));
            }

            var snacks = await query
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.CategoryId,
                    Category = s.Category.Name,
                    s.ImageUrl,
                    Location = new { lat = s.Location.Y, lng = s.Location.X },
                    s.ShopName,
                    s.ShopAddress,
                    s.AverageRating,
                    s.TotalRatings,
                    s.CreatedAt,
                    User = new { s.User.Id, s.User.Username }
                })
                .OrderBy(s => s.CreatedAt)
                .ToListAsync();

            return Ok(snacks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving snacks for location {Lat}, {Lng} with radius {Radius}", lat, lng, radius);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a specific snack by ID
    /// </summary>
    /// <param name="id">Snack ID</param>
    /// <returns>Snack details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetSnack(Guid id)
    {
        try
        {
            var snack = await _context.Snacks
                .Include(s => s.Category)
                .Include(s => s.User)
                .Include(s => s.Reviews.Where(r => !r.IsHidden))
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (snack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            var result = new
            {
                snack.Id,
                snack.Name,
                snack.Description,
                Category = snack.Category.Name,
                snack.ImageUrl,
                Location = new { lat = snack.Location.Y, lng = snack.Location.X },
                snack.ShopName,
                snack.ShopAddress,
                snack.AverageRating,
                snack.TotalRatings,
                snack.CreatedAt,
                User = new { snack.User.Id, snack.User.Username },
                Reviews = snack.Reviews.Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    User = new { r.User.Id, r.User.Username }
                })
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving snack {SnackId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Create a new snack (requires authentication)
    /// </summary>
    /// <param name="snackDto">Snack data</param>
    /// <returns>Created snack</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<object>> CreateSnack([FromBody] CreateSnackDto snackDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get user ID from JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            // Validate category exists
            var category = await _context.Categories.FindAsync(snackDto.CategoryId);
            if (category == null)
            {
                return BadRequest(new { message = "Invalid category ID" });
            }

            var location = _geometryFactory.CreatePoint(new Coordinate(snackDto.Location.Lng, snackDto.Location.Lat));

            var snack = new Snack
            {
                Id = Guid.NewGuid(),
                Name = snackDto.Name,
                Description = snackDto.Description,
                CategoryId = snackDto.CategoryId,
                ImageUrl = snackDto.ImageUrl,
                UserId = userId,
                Location = location,
                ShopName = snackDto.ShopName,
                ShopAddress = snackDto.ShopAddress,
                CreatedAt = DateTime.UtcNow
            };

            _context.Snacks.Add(snack);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSnack), new { id = snack.Id }, new
            {
                snack.Id,
                snack.Name,
                snack.Description,
                Category = category.Name,
                snack.ImageUrl,
                Location = new { lat = snack.Location.Y, lng = snack.Location.X },
                snack.ShopName,
                snack.ShopAddress,
                snack.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating snack");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update a snack (only by owner)
    /// </summary>
    /// <param name="id">Snack ID</param>
    /// <param name="snackDto">Updated snack data</param>
    /// <returns>Updated snack</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> UpdateSnack(Guid id, [FromBody] CreateSnackDto snackDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Get user ID from JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var existingSnack = await _context.Snacks
                .Include(s => s.Category)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (existingSnack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            // Check if user owns this snack
            if (existingSnack.UserId != userId)
            {
                return Forbid();
            }

            // Validate category exists
            var category = await _context.Categories.FindAsync(snackDto.CategoryId);
            if (category == null)
            {
                return BadRequest(new { message = "Invalid category ID" });
            }

            // Update snack properties
            existingSnack.Name = snackDto.Name;
            existingSnack.Description = snackDto.Description;
            existingSnack.CategoryId = snackDto.CategoryId;
            existingSnack.ImageUrl = snackDto.ImageUrl;
            existingSnack.ShopName = snackDto.ShopName;
            existingSnack.ShopAddress = snackDto.ShopAddress;
            
            // Update location if provided
            var location = _geometryFactory.CreatePoint(new Coordinate(snackDto.Location.Lng, snackDto.Location.Lat));
            existingSnack.Location = location;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                existingSnack.Id,
                existingSnack.Name,
                existingSnack.Description,
                existingSnack.CategoryId,
                Category = category.Name,
                existingSnack.ImageUrl,
                Location = new { lat = existingSnack.Location.Y, lng = existingSnack.Location.X },
                existingSnack.ShopName,
                existingSnack.ShopAddress,
                existingSnack.AverageRating,
                existingSnack.TotalRatings,
                existingSnack.CreatedAt,
                User = new { existingSnack.User.Id, existingSnack.User.Username }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating snack");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete a snack (only by owner)
    /// </summary>
    /// <param name="id">Snack ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteSnack(Guid id)
    {
        try
        {
            // Get user ID from JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var existingSnack = await _context.Snacks.FirstOrDefaultAsync(s => s.Id == id);

            if (existingSnack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            // Check if user owns this snack
            if (existingSnack.UserId != userId)
            {
                return Forbid();
            }

            _context.Snacks.Remove(existingSnack);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting snack");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class CreateSnackDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public LocationDto Location { get; set; } = new();
    public string? ShopName { get; set; }
    public string? ShopAddress { get; set; }
}

public class LocationDto
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}
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
    /// <returns>List of snacks within the specified radius</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<object>>> GetSnacks(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] int radius = 1000)
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
            
            var snacks = await _context.Snacks
                .Include(s => s.Category)
                .Include(s => s.User)
                .Where(s => s.Location.Distance(searchPoint) <= radius)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
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
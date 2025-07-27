using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;

namespace SnackSpotAuckland.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class SnacksController : ControllerBase
{
    private readonly SnackSpotDbContext _context;
    private readonly ILogger<SnacksController> _logger;

    public SnacksController(SnackSpotDbContext context, ILogger<SnacksController> logger)
    {
        _context = context;
        _logger = logger;
    }

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
            var queryString = HttpContext.Request.QueryString.Value;
            if (string.IsNullOrEmpty(queryString) || !queryString.Contains("lat=") || !queryString.Contains("lng="))
            {
                return BadRequest(new { message = "Latitude and longitude parameters are required" });
            }

            if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
            {
                return BadRequest(new { message = "Invalid latitude or longitude values" });
            }

            if (radius <= 0 || radius > 50000)
            {
                return BadRequest(new { message = "Radius must be between 1 and 50000 meters" });
            }

            var query = _context.Snacks
                .Include(s => s.Category)
                .Include(s => s.User)
                .Include(s => s.Store)
                .Where(s => !s.IsDeleted)
                .AsQueryable();

            // Filter by distance using store coordinates
            var latRange = radius / 111000.0;
            var lngRange = radius / (111000.0 * Math.Cos(lat * Math.PI / 180));

            query = query.Where(s => Math.Abs((double)s.Store.Latitude - lat) <= latRange &&
                               Math.Abs((double)s.Store.Longitude - lng) <= lngRange);

            if (categoryId.HasValue)
            {
                query = query.Where(s => s.CategoryId == categoryId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s =>
                    s.Name.ToLower().Contains(searchLower) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchLower)) ||
                    s.Store.Name.ToLower().Contains(searchLower));
            }

            var snacks = await query
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.CategoryId,
                    Category = s.Category.Name,
                    HasImage = s.Image != null,
                    Store = new { s.Store.Id, s.Store.Name, s.Store.Address, s.Store.Latitude, s.Store.Longitude },
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
                .Include(s => s.Store)
                .Include(s => s.Reviews.Where(r => !r.IsHidden))
                    .ThenInclude(r => r.User)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (snack == null || snack.IsDeleted)
            {
                return NotFound(new { message = "Snack not found" });
            }

            var result = new
            {
                snack.Id,
                snack.Name,
                snack.Description,
                Category = snack.Category.Name,
                HasImage = snack.Image != null,
                Store = new { snack.Store.Id, snack.Store.Name, snack.Store.Address, snack.Store.Latitude, snack.Store.Longitude },
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

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var category = await _context.Categories.FindAsync(snackDto.CategoryId);
            if (category == null || category.IsDeleted)
            {
                return BadRequest(new { message = "Invalid category ID" });
            }

            var store = await _context.Stores.FindAsync(snackDto.StoreId);
            if (store == null || store.IsDeleted)
            {
                return BadRequest(new { message = "Invalid store ID" });
            }

            var snack = new Snack
            {
                Id = Guid.NewGuid(),
                Name = snackDto.Name,
                Description = snackDto.Description,
                CategoryId = snackDto.CategoryId,
                UserId = userId,
                StoreId = snackDto.StoreId,
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
                Store = new { store.Id, store.Name, store.Address, store.Latitude, store.Longitude },
                snack.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating snack");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

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

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var existingSnack = await _context.Snacks
                .Include(s => s.Category)
                .Include(s => s.User)
                .Include(s => s.Store)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

            if (existingSnack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            if (existingSnack.UserId != userId)
            {
                return Forbid();
            }

            var category = await _context.Categories.FindAsync(snackDto.CategoryId);
            if (category == null || category.IsDeleted)
            {
                return BadRequest(new { message = "Invalid category ID" });
            }

            var store = await _context.Stores.FindAsync(snackDto.StoreId);
            if (store == null || store.IsDeleted)
            {
                return BadRequest(new { message = "Invalid store ID" });
            }

            existingSnack.Name = snackDto.Name;
            existingSnack.Description = snackDto.Description;
            existingSnack.CategoryId = snackDto.CategoryId;
            existingSnack.StoreId = snackDto.StoreId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                existingSnack.Id,
                existingSnack.Name,
                existingSnack.Description,
                existingSnack.CategoryId,
                Category = category.Name,
                Store = new { store.Id, store.Name, store.Address, store.Latitude, store.Longitude },
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
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var existingSnack = await _context.Snacks
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

            if (existingSnack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            if (existingSnack.UserId != userId)
            {
                return Forbid();
            }

            // Soft delete the snack
            existingSnack.IsDeleted = true;

            // Check if category has any other active snacks
            var categoryHasOtherSnacks = await _context.Snacks
                .AnyAsync(s => s.CategoryId == existingSnack.CategoryId && s.Id != id && !s.IsDeleted);

            // If category has no other snacks, soft delete it
            if (!categoryHasOtherSnacks)
            {
                var category = await _context.Categories.FindAsync(existingSnack.CategoryId);
                if (category != null)
                {
                    category.IsDeleted = true;
                }
            }

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
    public Guid StoreId { get; set; }
}
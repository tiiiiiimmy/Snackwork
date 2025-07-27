using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;
using System.Security.Claims;

namespace SnackSpotAuckland.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StoresController : ControllerBase
{
    private readonly SnackSpotDbContext _context;

    public StoresController(SnackSpotDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetStores([FromQuery] string? search = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Stores.Where(s => !s.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower().Trim();
            query = query.Where(s => s.Name.ToLower().Contains(searchLower) ||
                                   (s.Address != null && s.Address.ToLower().Contains(searchLower)));
        }

        var totalCount = await query.CountAsync();
        var stores = await query
            .OrderBy(s => s.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Address,
                s.Latitude,
                s.Longitude,
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            stores,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpPost]
    public async Task<ActionResult<object>> CreateStore([FromBody] CreateStoreRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized();
        }

        var normalizedName = request.Name.Trim().ToLower();
        var existingStore = await _context.Stores
            .Where(s => !s.IsDeleted)
            .FirstOrDefaultAsync(s => s.Name.ToLower() == normalizedName &&
                                    s.Latitude == request.Latitude &&
                                    s.Longitude == request.Longitude);

        if (existingStore != null)
        {
            return Ok(new
            {
                existingStore.Id,
                existingStore.Name,
                existingStore.Address,
                existingStore.Latitude,
                existingStore.Longitude,
                existingStore.CreatedAt
            });
        }

        var store = new Store
        {
            Name = request.Name.Trim(),
            Address = request.Address?.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedByUserId = userGuid
        };

        _context.Stores.Add(store);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetStore), new { id = store.Id }, new
        {
            store.Id,
            store.Name,
            store.Address,
            store.Latitude,
            store.Longitude,
            store.CreatedAt
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetStore(Guid id)
    {
        var store = await _context.Stores
            .Where(s => !s.IsDeleted && s.Id == id)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Address,
                s.Latitude,
                s.Longitude,
                s.CreatedAt,
                SnackCount = s.Snacks.Count(sn => !sn.IsDeleted)
            })
            .FirstOrDefaultAsync();

        if (store == null)
        {
            return NotFound();
        }

        return Ok(store);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteStore(Guid id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized();
        }

        var store = await _context.Stores
            .Include(s => s.Snacks)
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);

        if (store == null)
        {
            return NotFound();
        }

        var hasActiveSnacks = store.Snacks.Any(s => !s.IsDeleted);
        if (hasActiveSnacks)
        {
            return BadRequest(new { message = "Cannot delete store that has active snacks" });
        }

        store.IsDeleted = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateStoreRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
}
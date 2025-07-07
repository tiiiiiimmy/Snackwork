using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackSpotAuckland.Api.Data;
using SnackSpotAuckland.Api.Models;

namespace SnackSpotAuckland.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly SnackSpotDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(SnackSpotDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get user profile and badges
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>User profile with statistics and badges</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetUser(Guid id)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Snacks)
                .Include(u => u.Reviews)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Calculate user statistics
            var totalSnacks = user.Snacks.Count;
            var totalReviews = user.Reviews.Count;
            var averageRatingGiven = user.Reviews.Any() ? user.Reviews.Average(r => r.Rating) : 0;

            // Calculate badges based on activity
            var badges = CalculateUserBadges(user, totalSnacks, totalReviews);

            var result = new
            {
                user.Id,
                user.Username,
                user.Level,
                user.ExperiencePoints,
                Location = user.Location != null ? new { lat = user.Location.Y, lng = user.Location.X } : null,
                user.CreatedAt,
                Statistics = new
                {
                    TotalSnacks = totalSnacks,
                    TotalReviews = totalReviews,
                    AverageRatingGiven = Math.Round(averageRatingGiven, 2)
                },
                Badges = badges
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get current user profile (requires authentication)
    /// </summary>
    /// <returns>Current user profile</returns>
    [HttpGet("me")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<object> GetCurrentUser()
    {
        try
        {
            // TODO: Get user ID from JWT token
            // For now, return a placeholder response
            return Unauthorized(new { message = "Authentication required" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's snacks
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>List of snacks created by the user</returns>
    [HttpGet("{id}/snacks")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<object>>> GetUserSnacks(Guid id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var snacks = await _context.Snacks
                .Include(s => s.Category)
                .Where(s => s.UserId == id)
                .OrderByDescending(s => s.CreatedAt)
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
                    s.CreatedAt
                })
                .ToListAsync();

            return Ok(snacks);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving snacks for user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get user's reviews
    /// </summary>
    /// <param name="id">User ID</param>
    /// <returns>List of reviews created by the user</returns>
    [HttpGet("{id}/reviews")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<object>>> GetUserReviews(Guid id)
    {
        try
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var reviews = await _context.Reviews
                .Include(r => r.Snack)
                .Where(r => r.UserId == id && !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.SnackId,
                    SnackName = r.Snack.Name,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt
                })
                .ToListAsync();

            return Ok(reviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reviews for user {UserId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    private static List<Badge> CalculateUserBadges(User user, int totalSnacks, int totalReviews)
    {
        var badges = new List<Badge>();

        // First Snack Badge
        if (totalSnacks >= 1)
        {
            badges.Add(new Badge { Name = "First Snack", Description = "Added your first snack", Icon = "🍿" });
        }

        // Snack Explorer Badge
        if (totalSnacks >= 10)
        {
            badges.Add(new Badge { Name = "Snack Explorer", Description = "Added 10 snacks", Icon = "🗺️" });
        }

        // Snack Master Badge
        if (totalSnacks >= 50)
        {
            badges.Add(new Badge { Name = "Snack Master", Description = "Added 50 snacks", Icon = "👑" });
        }

        // Reviewer Badge
        if (totalReviews >= 5)
        {
            badges.Add(new Badge { Name = "Reviewer", Description = "Left 5 reviews", Icon = "⭐" });
        }

        // Level-based badges
        if (user.Level >= 2)
        {
            badges.Add(new Badge { Name = "Level 2", Description = "Reached Level 2", Icon = "🥉" });
        }

        if (user.Level >= 3)
        {
            badges.Add(new Badge { Name = "Level 3", Description = "Reached Level 3", Icon = "🥈" });
        }

        if (user.Level >= 5)
        {
            badges.Add(new Badge { Name = "Level 5", Description = "Reached Level 5", Icon = "🥇" });
        }

        // Early Adopter Badge (if user joined within first month of app launch)
        var appLaunchDate = new DateTime(2025, 1, 1); // Placeholder launch date
        if (user.CreatedAt <= appLaunchDate.AddDays(30))
        {
            badges.Add(new Badge { Name = "Early Adopter", Description = "Joined within the first month", Icon = "🚀" });
        }

        return badges;
    }
}

public class Badge
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
}
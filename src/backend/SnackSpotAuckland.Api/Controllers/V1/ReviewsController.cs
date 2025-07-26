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
public class ReviewsController : ControllerBase
{
    private readonly SnackSpotDbContext _context;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(SnackSpotDbContext context, ILogger<ReviewsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Submit a rating and review for a snack
    /// </summary>
    /// <param name="reviewDto">Review data</param>
    /// <returns>Created review</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<object>> CreateReview([FromBody] CreateReviewDto reviewDto)
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

            // Validate snack exists
            var snack = await _context.Snacks.FindAsync(reviewDto.SnackId);
            if (snack == null)
            {
                return BadRequest(new { message = "Invalid snack ID" });
            }

            // Check if user has already reviewed this snack
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.SnackId == reviewDto.SnackId && r.UserId == userId);

            if (existingReview != null)
            {
                return Conflict(new { message = "You have already reviewed this snack" });
            }

            var review = new Review
            {
                Id = Guid.NewGuid(),
                SnackId = reviewDto.SnackId,
                UserId = userId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);

            // Update snack's average rating and total ratings
            var reviews = await _context.Reviews
                .Where(r => r.SnackId == reviewDto.SnackId && !r.IsHidden)
                .ToListAsync();

            reviews.Add(review); // Include the new review

            snack.TotalRatings = reviews.Count;
            snack.AverageRating = (decimal)reviews.Average(r => r.Rating);

            await _context.SaveChangesAsync();

            var result = new
            {
                review.Id,
                review.SnackId,
                review.Rating,
                review.Comment,
                review.CreatedAt
            };

            return CreatedAtAction(nameof(GetReview), new { id = review.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a specific review by ID
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <returns>Review details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetReview(Guid id)
    {
        try
        {
            var review = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Snack)
                .FirstOrDefaultAsync(r => r.Id == id && !r.IsHidden);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            var result = new
            {
                review.Id,
                review.SnackId,
                SnackName = review.Snack.Name,
                review.Rating,
                review.Comment,
                review.CreatedAt,
                User = new { review.User.Id, review.User.Username }
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving review {ReviewId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get reviews for a specific snack
    /// </summary>
    /// <param name="snackId">Snack ID</param>
    /// <returns>List of reviews for the snack</returns>
    [HttpGet("snack/{snackId}")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<object>>> GetReviewsBySnack(Guid snackId)
    {
        try
        {
            var snack = await _context.Snacks.FindAsync(snackId);
            if (snack == null)
            {
                return NotFound(new { message = "Snack not found" });
            }

            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.SnackId == snackId && !r.IsHidden)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.Rating,
                    r.Comment,
                    r.CreatedAt,
                    User = new { r.User.Id, r.User.Username }
                })
                .ToListAsync();

            return Ok(reviews);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving reviews for snack {SnackId}", snackId);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Update a review (only by owner)
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <param name="reviewDto">Updated review data</param>
    /// <returns>Updated review</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> UpdateReview(Guid id, [FromBody] CreateReviewDto reviewDto)
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

            var existingReview = await _context.Reviews
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existingReview == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            // Check if user owns this review
            if (existingReview.UserId != userId)
            {
                return Forbid();
            }

            // Update review properties
            existingReview.Rating = reviewDto.Rating;
            existingReview.Comment = reviewDto.Comment;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                existingReview.Id,
                existingReview.Rating,
                existingReview.Comment,
                existingReview.CreatedAt,
                existingReview.SnackId,
                Username = existingReview.User?.Username ?? "Unknown"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Delete a review (only by owner)
    /// </summary>
    /// <param name="id">Review ID</param>
    /// <returns>No content</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteReview(Guid id)
    {
        try
        {
            // Get user ID from JWT token
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == id);

            if (review == null)
            {
                return NotFound(new { message = "Review not found" });
            }

            // Check if user owns this review
            if (review.UserId != userId)
            {
                return Forbid();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public class CreateReviewDto
{
    public Guid SnackId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class UpdateReviewDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
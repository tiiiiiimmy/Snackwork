using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnackSpotAuckland.Api.Data;

namespace SnackSpotAuckland.Api.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly SnackSpotDbContext _context;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(SnackSpotDbContext context, ILogger<ImagesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("{snackId}")]
    public async Task<ActionResult> GetImage(Guid snackId)
    {
        try
        {
            var snack = await _context.Snacks
                .Where(s => s.Id == snackId && !s.IsDeleted)
                .Select(s => new { s.Image })
                .FirstOrDefaultAsync();

            if (snack?.Image == null)
            {
                return NotFound();
            }

            // Set cache headers for immutable content
            Response.Headers["Cache-Control"] = "max-age=31536000, immutable";

            // Determine content type based on image header
            var contentType = GetImageContentType(snack.Image);

            return File(snack.Image, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image for snack {SnackId}", snackId);
            return StatusCode(500);
        }
    }

    private static string GetImageContentType(byte[] imageData)
    {
        if (imageData.Length < 4)
            return "application/octet-stream";

        // Check for common image formats by magic bytes
        if (imageData[0] == 0xFF && imageData[1] == 0xD8 && imageData[2] == 0xFF)
            return "image/jpeg";

        if (imageData[0] == 0x89 && imageData[1] == 0x50 && imageData[2] == 0x4E && imageData[3] == 0x47)
            return "image/png";

        if (imageData.Length >= 12 &&
            imageData[0] == 0x52 && imageData[1] == 0x49 && imageData[2] == 0x46 && imageData[3] == 0x46 &&
            imageData[8] == 0x57 && imageData[9] == 0x45 && imageData[10] == 0x42 && imageData[11] == 0x50)
            return "image/webp";

        return "application/octet-stream";
    }
}
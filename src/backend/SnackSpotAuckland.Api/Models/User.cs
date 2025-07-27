using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SnackSpotAuckland.Api.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Level { get; set; } = 1;

    [Range(0, int.MaxValue)]
    public int ExperiencePoints { get; set; } = 0;

    [Column(TypeName = "decimal(9,6)")]
    public decimal? Latitude { get; set; }

    [Column(TypeName = "decimal(9,6)")]
    public decimal? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [StringLength(64)]
    public string? InstagramHandle { get; set; }

    [StringLength(200)]
    public string? Bio { get; set; }

    [StringLength(8)]
    public string AvatarEmoji { get; set; } = "🍪";

    // Navigation properties
    public virtual ICollection<Snack> Snacks { get; set; } = new List<Snack>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
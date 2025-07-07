using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

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

    [Column(TypeName = "geography (point)")]
    public Point? Location { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Snack> Snacks { get; set; } = new List<Snack>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
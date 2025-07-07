using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace SnackSpotAuckland.Api.Models;

public enum DataSource
{
    User,
    Scraped,
    Seeded
}

public class Snack
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    public Guid CategoryId { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    [Column(TypeName = "geography (point)")]
    public Point Location { get; set; } = null!;

    [StringLength(200)]
    public string? ShopName { get; set; }

    [StringLength(500)]
    public string? ShopAddress { get; set; }

    [Range(0.0, 5.0)]
    [Column(TypeName = "decimal(3,2)")]
    public decimal AverageRating { get; set; } = 0.0m;

    [Range(0, int.MaxValue)]
    public int TotalRatings { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DataSource DataSource { get; set; } = DataSource.User;

    // Navigation properties
    [ForeignKey(nameof(CategoryId))]
    public virtual Category Category { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}
using Microsoft.EntityFrameworkCore;
using SnackSpotAuckland.Api.Models;
using NetTopologySuite;

namespace SnackSpotAuckland.Api.Data;

public class SnackSpotDbContext : DbContext
{
    public SnackSpotDbContext(DbContextOptions<SnackSpotDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Snack> Snacks { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure Category entity
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.Name).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Configure Snack entity
        modelBuilder.Entity<Snack>(entity =>
        {
            entity.HasIndex(e => e.Location)
                .HasMethod("GIST");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.DataSource).HasConversion<string>();

            entity.HasOne(s => s.Category)
                .WithMany(c => c.Snacks)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.User)
                .WithMany(u => u.Snacks)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure Review entity
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => new { e.SnackId, e.UserId }).IsUnique();
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(r => r.Snack)
                .WithMany(s => s.Reviews)
                .HasForeignKey(r => r.SnackId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure RefreshToken entity
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
            
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed initial categories
        modelBuilder.Entity<Category>().HasData(
            new Category { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Sweet Snacks", Description = "Cookies, chocolates, and other sweet treats" },
            new Category { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Savory Snacks", Description = "Chips, crackers, and salty snacks" },
            new Category { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Healthy Snacks", Description = "Nuts, fruits, and nutritious options" },
            new Category { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Drinks", Description = "Beverages and liquid refreshments" },
            new Category { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Vegan Snacks", Description = "Plant-based snack options" }
        );
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is User || e.Entity is Category || e.Entity is Review)
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is User user)
                user.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Category category)
                category.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Review review)
                review.UpdatedAt = DateTime.UtcNow;
        }
    }
}
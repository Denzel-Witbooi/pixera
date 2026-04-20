using Microsoft.EntityFrameworkCore;
using Pixera.Api.Models;

namespace Pixera.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Album> Albums => Set<Album>();
    public DbSet<MediaItem> MediaItems => Set<MediaItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Album>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.CreatedAt).HasDefaultValueSql("now()");
        });

        modelBuilder.Entity<MediaItem>(e =>
        {
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Album)
             .WithMany(a => a.MediaItems)
             .HasForeignKey(m => m.AlbumId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(m => m.CreatedAt).HasDefaultValueSql("now()");
        });
    }
}

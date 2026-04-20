namespace Pixera.Api.Models;

public class MediaItem
{
    public Guid Id { get; set; }
    public Guid AlbumId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public Album Album { get; set; } = null!;
}

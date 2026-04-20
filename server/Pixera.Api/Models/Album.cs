namespace Pixera.Api.Models;

public class Album
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CoverUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public ICollection<MediaItem> MediaItems { get; set; } = new List<MediaItem>();
}

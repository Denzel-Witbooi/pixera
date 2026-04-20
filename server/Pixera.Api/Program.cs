using Microsoft.EntityFrameworkCore;
using Pixera.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

app.MapGet("/api/albums", async (AppDbContext db) =>
{
    var albums = await db.Albums
        .Select(a => new
        {
            id = a.Id.ToString(),
            title = a.Title,
            description = a.Description,
            coverUrl = a.CoverUrl,
            createdAt = a.CreatedAt.ToString("O"),
            itemCount = a.MediaItems.Count,
            slug = a.Slug,
            userId = a.UserId,
        })
        .ToListAsync();

    return Results.Ok(albums);
});

app.MapGet("/api/albums/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var album = await db.Albums
        .Where(a => a.Id == id)
        .Select(a => new
        {
            id = a.Id.ToString(),
            title = a.Title,
            description = a.Description,
            coverUrl = a.CoverUrl,
            createdAt = a.CreatedAt.ToString("O"),
            itemCount = a.MediaItems.Count,
            slug = a.Slug,
            userId = a.UserId,
        })
        .FirstOrDefaultAsync();

    return album is null ? Results.NotFound() : Results.Ok(album);
});

app.MapGet("/api/albums/{id:guid}/media", async (Guid id, AppDbContext db) =>
{
    var albumExists = await db.Albums.AnyAsync(a => a.Id == id);
    if (!albumExists) return Results.NotFound();

    var media = await db.MediaItems
        .Where(m => m.AlbumId == id)
        .Select(m => new
        {
            id = m.Id.ToString(),
            albumId = m.AlbumId.ToString(),
            url = m.Url,
            type = m.Type,
            createdAt = m.CreatedAt.ToString("O"),
            title = m.Title,
            description = m.Description,
        })
        .ToListAsync();

    return Results.Ok(media);
});

app.Run();

public partial class Program { }

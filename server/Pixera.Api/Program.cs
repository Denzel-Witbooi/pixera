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
            userId = a.UserId,
        })
        .ToListAsync();

    return Results.Ok(albums);
});

app.Run();

public partial class Program { }

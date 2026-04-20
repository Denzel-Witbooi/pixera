using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using Pixera.Api.Auth;
using Pixera.Api.Data;
using Pixera.Api.Utilities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default"))
           .UseSnakeCaseNamingConvention());

var minioCfg = builder.Configuration.GetSection("MinIO");
builder.Services.AddMinio(opts => opts
    .WithEndpoint(minioCfg["Endpoint"]!)
    .WithCredentials(minioCfg["AccessKey"]!, minioCfg["SecretKey"]!)
    .WithSSL(minioCfg.GetValue<bool>("UseSSL")));

// ── Authentication ─────────────────────────────────────────────────────────────
// Development: every request is automatically authenticated — no Keycloak needed.
// Staging / Production: validate JWTs issued by the Keycloak realm.
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddAuthentication("DevBypass")
        .AddScheme<AuthenticationSchemeOptions, DevBypassAuthHandler>("DevBypass", _ => { });
}
else
{
    var kc = builder.Configuration.GetSection("Keycloak");
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opts =>
        {
            opts.Authority = kc["Authority"];
            opts.Audience  = kc["Audience"];
            opts.RequireHttpsMetadata = true;
        });
}

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

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

app.MapGet("/api/storage/{bucket}/{*objectPath}", async (string bucket, string objectPath, IMinioClient minio) =>
{
    try
    {
        var stream = new MemoryStream();
        await minio.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectPath)
            .WithCallbackStream((s, _) => s.CopyToAsync(stream)));

        stream.Position = 0;
        var contentType = GetContentType(objectPath);
        return Results.Stream(stream, contentType);
    }
    catch (ObjectNotFoundException)
    {
        return Results.NotFound();
    }
});

// ── Protected admin group — Phase 5/6 write endpoints go here ─────────────────
// RequireAuthorization() means every endpoint in this group needs a valid token
// (or the DevBypass handler in Development).
var admin = app.MapGroup("/api/admin").RequireAuthorization();
admin.MapGet("/me", (HttpContext ctx) =>
    Results.Ok(new { username = ctx.User.Identity?.Name }));

admin.MapPost("/albums", async (CreateAlbumRequest req, AppDbContext db, HttpContext ctx) =>
{
    var album = new Pixera.Api.Models.Album
    {
        Id = Guid.NewGuid(),
        Title = req.Title,
        Description = req.Description ?? "",
        CoverUrl = "",
        Slug = SlugGenerator.Generate(req.Title),
        UserId = ctx.User.Identity?.Name ?? "unknown",
        CreatedAt = DateTime.UtcNow,
    };

    db.Albums.Add(album);
    await db.SaveChangesAsync();

    return Results.Created($"/api/albums/{album.Id}", new
    {
        id = album.Id.ToString(),
        title = album.Title,
        description = album.Description,
        coverUrl = album.CoverUrl,
        createdAt = album.CreatedAt.ToString("O"),
        itemCount = 0,
        slug = album.Slug,
        userId = album.UserId,
    });
});

admin.MapPut("/albums/{id:guid}", async (Guid id, UpdateAlbumRequest req, AppDbContext db) =>
{
    var album = await db.Albums.FindAsync(id);
    if (album is null) return Results.NotFound();

    album.Title = req.Title;
    album.Description = req.Description ?? "";
    await db.SaveChangesAsync();

    return Results.NoContent();
});

admin.MapDelete("/albums/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var album = await db.Albums.FindAsync(id);
    if (album is null) return Results.NotFound();

    db.Albums.Remove(album);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();

static string GetContentType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
{
    ".jpg" or ".jpeg" => "image/jpeg",
    ".png"            => "image/png",
    ".gif"            => "image/gif",
    ".webp"           => "image/webp",
    ".mp4"            => "video/mp4",
    ".mov"            => "video/quicktime",
    _                 => "application/octet-stream",
};

public partial class Program { }

record CreateAlbumRequest(string Title, string? Description);
record UpdateAlbumRequest(string Title, string? Description);

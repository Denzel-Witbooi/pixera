using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
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
// Development or AUTH_BYPASS=true: every request is auto-authenticated.
// Production (no bypass): validate JWTs issued by the Keycloak realm.
var authBypass = builder.Configuration.GetValue<bool>("AUTH_BYPASS");

if (builder.Environment.IsDevelopment() || authBypass)
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(opts =>
    opts.SwaggerDoc("v1", new() { Title = "Pixera API", Version = "v1" }));

var corsOrigins = (builder.Configuration["CORS_ALLOWED_ORIGINS"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Concat(new[] { "http://localhost:8080", "http://localhost:5173" })
    .ToArray();

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));

builder.Services.AddHttpClient("github", client =>
{
    client.BaseAddress = new Uri("https://api.github.com");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("Pixera-Feedback/1.0");
    client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
    client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
});

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(opts => opts.SwaggerEndpoint("/swagger/v1/swagger.json", "Pixera API v1"));
}

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

app.MapGet("/api/albums/slug/{slug}", async (string slug, AppDbContext db) =>
{
    var album = await db.Albums
        .Where(a => a.Slug == slug)
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

app.MapPost("/api/feedback", async (FeedbackRequest req, IHttpClientFactory httpFactory, IConfiguration config) =>
{
    if (string.IsNullOrWhiteSpace(req.Name) ||
        string.IsNullOrWhiteSpace(req.Email) ||
        string.IsNullOrWhiteSpace(req.Message))
        return Results.BadRequest("Name, email and message are required.");

    var token = config["GitHub:Token"];
    var repo  = config["GitHub:Repo"];

    if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(repo))
        return Results.Problem("Feedback is not configured on this server.");

    var labelMap = new Dictionary<string, string>
    {
        { "Bug report",      "bug"         },
        { "Feature request", "enhancement" },
        { "General",         "question"    },
    };
    var label = labelMap.TryGetValue(req.Category ?? "", out var l) ? l : "feedback";

    var body = $"""
        **From:** {req.Name} ({req.Email})
        **Category:** {req.Category ?? "General"}

        {req.Message}
        """;

    var payload = JsonSerializer.Serialize(new
    {
        title  = $"[Feedback] {req.Category ?? "General"} from {req.Name}",
        body,
        labels = new[] { "feedback", label },
    });

    var client = httpFactory.CreateClient("github");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    var response = await client.PostAsync(
        $"/repos/{repo}/issues",
        new StringContent(payload, Encoding.UTF8, "application/json"));

    return response.IsSuccessStatusCode
        ? Results.Ok(new { message = "Feedback submitted. Thank you!" })
        : Results.Problem("Failed to submit feedback. Please try again later.");
});

// ── Protected admin group — Phase 5/6 write endpoints go here ─────────────────
// RequireAuthorization() means every endpoint in this group needs a valid token
// (or the DevBypass handler in Development).
var admin = app.MapGroup("/api/admin").RequireAuthorization();
admin.MapGet("/me", (HttpContext ctx) =>
    Results.Ok(new { username = ctx.User.Identity?.Name }));

admin.MapPost("/albums", async (CreateAlbumRequest req, AppDbContext db, HttpContext ctx) =>
{
    var baseSlug = SlugGenerator.Generate(req.Title);
    var slug = baseSlug;
    var counter = 2;
    while (await db.Albums.AnyAsync(a => a.Slug == slug))
    {
        slug = $"{baseSlug}-{counter++}";
    }

    var album = new Pixera.Api.Models.Album
    {
        Id = Guid.NewGuid(),
        Title = req.Title,
        Description = req.Description ?? "",
        CoverUrl = "",
        Slug = slug,
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

admin.MapPatch("/albums/{id:guid}/cover", async (Guid id, SetCoverRequest req, AppDbContext db) =>
{
    var album = await db.Albums.FindAsync(id);
    if (album is null) return Results.NotFound();

    album.CoverUrl = req.CoverUrl;
    await db.SaveChangesAsync();

    return Results.NoContent();
});

admin.MapPost("/storage/upload", async (HttpRequest request, IMinioClient minio, IConfiguration config) =>
{
    if (!request.HasFormContentType) return Results.BadRequest("Expected multipart/form-data");

    var form     = await request.ReadFormAsync();
    var file     = form.Files["file"];
    var albumId  = form["albumId"].FirstOrDefault();

    if (file is null || string.IsNullOrEmpty(albumId))
        return Results.BadRequest("Missing file or albumId");

    var bucket    = config["MinIO:Bucket"]!;
    var ext       = Path.GetExtension(file.FileName).ToLowerInvariant();
    var objectKey = $"albums/{albumId}/{Guid.NewGuid()}{ext}";

    using var stream = file.OpenReadStream();
    await minio.PutObjectAsync(new PutObjectArgs()
        .WithBucket(bucket)
        .WithObject(objectKey)
        .WithStreamData(stream)
        .WithObjectSize(file.Length)
        .WithContentType(file.ContentType));

    return Results.Ok(new { url = $"/api/storage/{bucket}/{objectKey}" });
}).DisableAntiforgery();

admin.MapPost("/albums/{id:guid}/media", async (Guid id, InsertMediaRequest req, AppDbContext db) =>
{
    var album = await db.Albums.FindAsync(id);
    if (album is null) return Results.NotFound();

    var item = new Pixera.Api.Models.MediaItem
    {
        Id          = Guid.NewGuid(),
        AlbumId     = id,
        Url         = req.Url,
        Type        = req.Type,
        Title       = req.Title,
        Description = req.Description,
        CreatedAt   = DateTime.UtcNow,
    };

    db.MediaItems.Add(item);

    if (string.IsNullOrEmpty(album.CoverUrl))
        album.CoverUrl = req.Url;

    await db.SaveChangesAsync();

    return Results.Created($"/api/albums/{id}/media/{item.Id}", new
    {
        id          = item.Id.ToString(),
        albumId     = item.AlbumId.ToString(),
        url         = item.Url,
        type        = item.Type,
        createdAt   = item.CreatedAt.ToString("O"),
        title       = item.Title,
        description = item.Description,
    });
});

admin.MapDelete("/media/{id:guid}", async (Guid id, AppDbContext db, IMinioClient minio, IConfiguration config) =>
{
    var item = await db.MediaItems
        .Include(m => m.Album)
        .FirstOrDefaultAsync(m => m.Id == id);

    if (item is null) return Results.NotFound();

    var wasAlbumCover = item.Album.CoverUrl == item.Url;
    var albumId       = item.AlbumId;

    db.MediaItems.Remove(item);
    await db.SaveChangesAsync();

    if (wasAlbumCover)
    {
        var next = await db.MediaItems.Where(m => m.AlbumId == albumId).FirstOrDefaultAsync();
        item.Album.CoverUrl = next?.Url ?? "";
        await db.SaveChangesAsync();
    }

    // Best-effort file deletion — don't fail the request if the object is already gone
    try
    {
        var bucket = config["MinIO:Bucket"]!;
        var prefix = $"/api/storage/{bucket}/";
        if (item.Url.StartsWith(prefix))
        {
            var objectKey = item.Url[prefix.Length..];
            await minio.RemoveObjectAsync(new RemoveObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectKey));
        }
    }
    catch { /* best effort */ }

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

record FeedbackRequest(string Name, string Email, string? Category, string Message);
record CreateAlbumRequest(string Title, string? Description);
record UpdateAlbumRequest(string Title, string? Description);
record SetCoverRequest(string CoverUrl);
record InsertMediaRequest(string Url, string Type, string? Title, string? Description);

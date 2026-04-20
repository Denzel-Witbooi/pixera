using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Pixera.Api.Data;
using Pixera.Api.Models;
using Pixera.Api.Tests.Infrastructure;

namespace Pixera.Api.Tests;

public class AlbumsEndpointTests : IAsyncLifetime
{
    private readonly PixeraWebFactory _factory = new();
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _factory.MigrateDatabaseAsync();
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task GetAlbums_ReturnsOkWithEmptyArray_WhenNoneExist()
    {
        var response = await _client.GetAsync("/api/albums");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var albums = await response.Content.ReadFromJsonAsync<List<AlbumDto>>();
        albums.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAlbums_ReturnsAlbumsWithCorrectShape_WhenAlbumsExist()
    {
        await SeedAlbumAsync(new Album
        {
            Id = Guid.NewGuid(),
            Title = "Wedding 2024",
            Description = "Ceremony photos",
            CoverUrl = "https://example.com/cover.jpg",
            CreatedAt = new DateTime(2024, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            UserId = "user-1",
        });

        var response = await _client.GetAsync("/api/albums");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var albums = await response.Content.ReadFromJsonAsync<List<AlbumDto>>();
        albums.Should().HaveCount(1);
        var album = albums![0];
        album.Title.Should().Be("Wedding 2024");
        album.Description.Should().Be("Ceremony photos");
        album.CoverUrl.Should().Be("https://example.com/cover.jpg");
        album.UserId.Should().Be("user-1");
        album.ItemCount.Should().Be(0);
        album.Id.Should().NotBeNullOrEmpty();
        album.CreatedAt.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetAlbumById_ReturnsAlbumWithSlug_WhenExists()
    {
        var id = Guid.NewGuid();
        await SeedAlbumAsync(new Album
        {
            Id = id,
            Title = "Summer Trip",
            Description = "Beach photos",
            CoverUrl = "https://example.com/cover.jpg",
            CreatedAt = new DateTime(2024, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            Slug = "summer-trip",
            UserId = "user-1",
        });

        var response = await _client.GetAsync($"/api/albums/{id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var album = await response.Content.ReadFromJsonAsync<AlbumDto>();
        album!.Id.Should().Be(id.ToString());
        album.Title.Should().Be("Summer Trip");
        album.Slug.Should().Be("summer-trip");
    }

    [Fact]
    public async Task GetAlbumById_Returns404_WhenNotFound()
    {
        var response = await _client.GetAsync($"/api/albums/{Guid.NewGuid()}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAlbumMedia_ReturnsEmptyArray_WhenAlbumHasNoMedia()
    {
        var albumId = Guid.NewGuid();
        await SeedAlbumAsync(new Album { Id = albumId, Title = "Empty", Slug = "empty", UserId = "u1",
            CreatedAt = DateTime.UtcNow });

        var response = await _client.GetAsync($"/api/albums/{albumId}/media");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var media = await response.Content.ReadFromJsonAsync<List<MediaItemDto>>();
        media.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAlbumMedia_ReturnsMediaItems_WhenTheyExist()
    {
        var albumId = Guid.NewGuid();
        await SeedAlbumAsync(new Album { Id = albumId, Title = "Filled", Slug = "filled", UserId = "u1",
            CreatedAt = DateTime.UtcNow });
        await SeedMediaAsync(new MediaItem
        {
            Id = Guid.NewGuid(), AlbumId = albumId, Url = "https://example.com/photo.jpg",
            Type = "image", CreatedAt = DateTime.UtcNow,
        });

        var response = await _client.GetAsync($"/api/albums/{albumId}/media");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var media = await response.Content.ReadFromJsonAsync<List<MediaItemDto>>();
        media.Should().HaveCount(1);
        media![0].Url.Should().Be("https://example.com/photo.jpg");
        media[0].Type.Should().Be("image");
        media[0].AlbumId.Should().Be(albumId.ToString());
    }

    [Fact]
    public async Task GetAlbumMedia_Returns404_WhenAlbumNotFound()
    {
        var response = await _client.GetAsync($"/api/albums/{Guid.NewGuid()}/media");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private async Task SeedAlbumAsync(Album album)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Albums.Add(album);
        await db.SaveChangesAsync();
    }

    private async Task SeedMediaAsync(MediaItem item)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.MediaItems.Add(item);
        await db.SaveChangesAsync();
    }
}

public record AlbumDto(
    string Id,
    string Title,
    string Description,
    string CoverUrl,
    string CreatedAt,
    int ItemCount,
    string Slug,
    string UserId);

public record MediaItemDto(
    string Id,
    string AlbumId,
    string Url,
    string Type,
    string CreatedAt,
    string? Title,
    string? Description);

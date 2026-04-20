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

    private async Task SeedAlbumAsync(Album album)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Albums.Add(album);
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
    string UserId);

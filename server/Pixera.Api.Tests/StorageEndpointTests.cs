using System.Net;
using FluentAssertions;
using Pixera.Api.Tests.Infrastructure;

namespace Pixera.Api.Tests;

public class StorageEndpointTests : IAsyncLifetime
{
    private readonly PixeraWebFactory _factory = new();
    private HttpClient _client = null!;
    private const string Bucket = "pixera-test";

    public async Task InitializeAsync()
    {
        await _factory.MigrateDatabaseAsync();
        await _factory.EnsureMinioTestBucketAsync();
        _client = _factory.CreateClient();
    }

    public async Task DisposeAsync()
    {
        await _factory.ResetDatabaseAsync();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task GetStorage_ReturnsFileContent_WhenObjectExists()
    {
        var content = "fake-image-bytes"u8.ToArray();
        await _factory.PutTestObjectAsync(Bucket, "test-photo.jpg", content, "image/jpeg");

        var response = await _client.GetAsync($"/api/storage/{Bucket}/test-photo.jpg");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        var body = await response.Content.ReadAsByteArrayAsync();
        body.Should().Equal(content);

        await _factory.RemoveTestObjectAsync(Bucket, "test-photo.jpg");
    }

    [Fact]
    public async Task GetStorage_Returns404_WhenObjectNotFound()
    {
        var response = await _client.GetAsync($"/api/storage/{Bucket}/does-not-exist.jpg");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetStorage_SetsCorrectContentType_ForDifferentExtensions()
    {
        var png = "fake-png"u8.ToArray();
        await _factory.PutTestObjectAsync(Bucket, "image.png", png, "image/png");

        var response = await _client.GetAsync($"/api/storage/{Bucket}/image.png");

        response.Content.Headers.ContentType!.MediaType.Should().Be("image/png");
        await _factory.RemoveTestObjectAsync(Bucket, "image.png");
    }
}

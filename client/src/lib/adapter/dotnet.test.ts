import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { Album } from "@/lib/types";
import { DotNetAdapter } from "./dotnet";

const API_BASE = "http://localhost:5000";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DotNetAdapter.fetchAlbums", () => {
  it("returns empty array when API returns empty array", async () => {
    server.use(
      http.get(`${API_BASE}/api/albums`, () => HttpResponse.json([]))
    );

    const adapter = new DotNetAdapter(API_BASE);
    const albums = await adapter.fetchAlbums();

    expect(albums).toEqual([]);
  });

  it("maps API response to Album domain type", async () => {
    const apiResponse = [
      {
        id: "abc-123",
        title: "Wedding 2024",
        description: "Ceremony photos",
        coverUrl: "https://example.com/cover.jpg",
        createdAt: "2024-06-15T00:00:00.0000000Z",
        itemCount: 3,
        userId: "user-1",
      },
    ];

    server.use(
      http.get(`${API_BASE}/api/albums`, () => HttpResponse.json(apiResponse))
    );

    const adapter = new DotNetAdapter(API_BASE);
    const albums = await adapter.fetchAlbums();

    expect(albums).toHaveLength(1);
    const album: Album = albums[0];
    expect(album.id).toBe("abc-123");
    expect(album.title).toBe("Wedding 2024");
    expect(album.description).toBe("Ceremony photos");
    expect(album.coverUrl).toBe("https://example.com/cover.jpg");
    expect(album.createdAt).toBe("2024-06-15T00:00:00.0000000Z");
    expect(album.itemCount).toBe(3);
    expect(album.userId).toBe("user-1");
  });

  it("throws when the API returns a non-2xx response", async () => {
    server.use(
      http.get(`${API_BASE}/api/albums`, () =>
        HttpResponse.json({ error: "Internal Server Error" }, { status: 500 })
      )
    );

    const adapter = new DotNetAdapter(API_BASE);
    await expect(adapter.fetchAlbums()).rejects.toThrow();
  });
});

describe("DotNetAdapter.fetchAlbum", () => {
  it("returns Album when found", async () => {
    const apiResponse = {
      id: "abc-123",
      title: "Summer Trip",
      description: "Beach photos",
      coverUrl: "https://example.com/cover.jpg",
      createdAt: "2024-08-01T00:00:00.0000000Z",
      itemCount: 2,
      slug: "summer-trip",
      userId: "user-1",
    };

    server.use(
      http.get(`${API_BASE}/api/albums/abc-123`, () => HttpResponse.json(apiResponse))
    );

    const adapter = new DotNetAdapter(API_BASE);
    const album = await adapter.fetchAlbum("abc-123");

    expect(album).not.toBeNull();
    expect(album!.id).toBe("abc-123");
    expect(album!.slug).toBe("summer-trip");
  });

  it("returns null when album not found", async () => {
    server.use(
      http.get(`${API_BASE}/api/albums/missing`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    const adapter = new DotNetAdapter(API_BASE);
    const album = await adapter.fetchAlbum("missing");

    expect(album).toBeNull();
  });
});

describe("DotNetAdapter.fetchMedia", () => {
  it("returns MediaItem array for an album", async () => {
    const apiResponse = [
      {
        id: "m-1",
        albumId: "abc-123",
        url: "https://example.com/photo.jpg",
        type: "image",
        createdAt: "2024-08-01T00:00:00.0000000Z",
        title: null,
        description: null,
      },
    ];

    server.use(
      http.get(`${API_BASE}/api/albums/abc-123/media`, () =>
        HttpResponse.json(apiResponse)
      )
    );

    const adapter = new DotNetAdapter(API_BASE);
    const media = await adapter.fetchMedia("abc-123");

    expect(media).toHaveLength(1);
    expect(media[0].url).toBe("https://example.com/photo.jpg");
    expect(media[0].type).toBe("image");
    expect(media[0].albumId).toBe("abc-123");
  });
});

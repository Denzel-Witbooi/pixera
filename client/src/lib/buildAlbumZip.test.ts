import JSZip from "jszip";
import { describe, expect, it, vi } from "vitest";
import { buildAlbumZip } from "./buildAlbumZip";
import type { MediaItem } from "./types";

const makeItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: "m-1",
  albumId: "a-1",
  url: "https://example.com/photo.jpg",
  type: "image",
  createdAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

const fakeFetch = (content: string) =>
  vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(content).buffer),
  } as unknown as Response);

describe("buildAlbumZip", () => {
  it("creates a zip with one file per media item", async () => {
    const items = [makeItem({ id: "m-1", title: "Sunset", url: "https://example.com/sunset.jpg" })];
    const fetch = fakeFetch("image-bytes");

    const zip = await buildAlbumZip(items, fetch as unknown as typeof globalThis.fetch);

    const files = Object.keys(zip.files);
    expect(files).toHaveLength(1);
    expect(files[0]).toBe("Sunset.jpg");
  });

  it("falls back to index-based filename when title is absent", async () => {
    const items = [makeItem({ id: "m-1", title: undefined, url: "https://example.com/img.png" })];
    const fetch = fakeFetch("bytes");

    const zip = await buildAlbumZip(items, fetch as unknown as typeof globalThis.fetch);

    expect(Object.keys(zip.files)[0]).toBe("image-1.png");
  });

  it("includes correct file content in the zip", async () => {
    const items = [makeItem({ url: "https://example.com/photo.jpg", title: "Photo" })];
    const fetch = fakeFetch("my-image-data");

    const zip = await buildAlbumZip(items, fetch as unknown as typeof globalThis.fetch);

    const content = await zip.file("Photo.jpg")!.async("string");
    expect(content).toBe("my-image-data");
  });

  it("includes all items when multiple media items exist", async () => {
    const items = [
      makeItem({ id: "m-1", title: "First",  url: "https://example.com/a.jpg" }),
      makeItem({ id: "m-2", title: "Second", url: "https://example.com/b.jpg" }),
      makeItem({ id: "m-3", title: "Third",  url: "https://example.com/c.jpg" }),
    ];
    const fetch = fakeFetch("bytes");

    const zip = await buildAlbumZip(items, fetch as unknown as typeof globalThis.fetch);

    expect(Object.keys(zip.files)).toHaveLength(3);
  });
});

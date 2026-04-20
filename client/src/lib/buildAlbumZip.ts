import JSZip from "jszip";
import type { MediaItem } from "./types";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function extFromResponse(response: Response, url: string): string {
  const mime = response.headers.get("content-type")?.split(";")[0].trim() ?? "";
  if (MIME_TO_EXT[mime]) return MIME_TO_EXT[mime];
  const lastSegment = url.split("?")[0].split("/").pop() ?? "";
  const dotExt = lastSegment.includes(".") ? lastSegment.split(".").pop() ?? "" : "";
  return /^[a-z0-9]{2,5}$/.test(dotExt) ? dotExt : "jpg";
}

export async function buildAlbumZip(
  items: MediaItem[],
  fetcher: typeof fetch = fetch
): Promise<JSZip> {
  const zip = new JSZip();

  await Promise.all(
    items.map(async (item, index) => {
      const res = await fetcher(item.url);
      const ext = extFromResponse(res, item.url);
      const name = item.title ? `${item.title}.${ext}` : `${item.type}-${index + 1}.${ext}`;
      const buffer = await res.arrayBuffer();
      zip.file(name, buffer);
    })
  );

  return zip;
}

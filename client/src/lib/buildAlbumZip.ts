import JSZip from "jszip";
import type { MediaItem } from "./types";

export async function buildAlbumZip(
  items: MediaItem[],
  fetcher: typeof fetch = fetch
): Promise<JSZip> {
  const zip = new JSZip();

  await Promise.all(
    items.map(async (item, index) => {
      const ext = item.url.split(".").pop()?.split("?")[0] ?? "jpg";
      const name = item.title ? `${item.title}.${ext}` : `${item.type}-${index + 1}.${ext}`;

      const res = await fetcher(item.url);
      const buffer = await res.arrayBuffer();
      zip.file(name, buffer);
    })
  );

  return zip;
}

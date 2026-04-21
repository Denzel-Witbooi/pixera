# Phase 6 — Admin Media Management
**Date:** 2026-04-21
**Branch:** `phase-6/admin-media-management`
**GitHub Issue:** [#8](https://github.com/Denzel-Witbooi/pixera/issues/8)
**Status:** Complete

---

## What this phase is about (plain English)

Phase 5 gave admins the ability to create and manage albums as containers. But those containers are still empty — there is no way to put anything in them through the admin UI.

This phase fills the albums. An admin can open any album in the Admin Panel, upload a batch of photos and videos in one go, watch each file progress from pending to complete (or see a clear error if one fails), delete individual items, and promote any item to be the album cover. The public gallery updates immediately after every change — no page refresh required.

---

## Key decisions explained (plain English)

### Why MinIO for file storage?

When a photo is uploaded, it has to live somewhere. The options considered:

| Option | What it is | Why it was not chosen |
|---|---|---|
| **Store files in the database** | Save the raw bytes as a blob column in PostgreSQL | Databases are optimised for structured data, not binary files. Large blobs slow down every query, bloat backups, and make the DB hard to scale. |
| **Store files on the server's local disk** | Write to the filesystem of the .NET API server | Works for a single server but breaks the moment you run more than one. Files on server A are invisible to server B. Not suitable for any cloud or containerised deployment. |
| **AWS S3 / Azure Blob Storage** | Managed cloud object storage | Excellent services, but they lock the project into a specific cloud provider and add ongoing cost. For a self-hosted product, paying per GB to a third party is unnecessary. |
| **MinIO** | Self-hosted, S3-compatible object storage | ✅ Chosen. MinIO is free, runs in Docker alongside the API, stores files on your own disk or cloud volume, and exposes the same API as Amazon S3. If you ever need to migrate to S3, no code changes are required — just swap the endpoint. |

MinIO was already set up and wired into the .NET API in Phase 1. This phase is the first time the client actually uses it.

### Why upload directly through the .NET API rather than straight to MinIO?

The client could in theory talk to MinIO directly, but that would require exposing MinIO's access key and secret to the browser — which anyone could extract and use to read or delete anything in storage.

Instead, the flow is:
1. Browser sends the file to the .NET API (`POST /api/storage/upload`)
2. The API — which already holds the MinIO credentials securely on the server — streams the file into the bucket
3. The API returns the public URL
4. The browser then registers the media item in the database (`POST /api/albums/:id/media`)

This keeps credentials on the server where they belong.

### Why per-file progress and independent error states?

Uploading ten photos as one request is simpler to implement but produces poor UX: if one file fails, you do not know which one, and you may have to retry all ten. By uploading files concurrently but independently:

- Each file has its own progress indicator (pending → uploading → complete / failed)
- A failed file shows its own error message and can be retried individually
- Successful uploads are not blocked or rolled back by a single failure

This is the same approach used by Dropbox, Google Drive, and most modern upload interfaces.

### Why auto-assign the first uploaded item as Cover?

When an album has no cover, the album list in the Admin Panel and the public gallery both show a placeholder icon. The moment any media is uploaded, it makes sense for *something* to appear as the cover without forcing the admin to do an extra step. The first uploaded item becomes the cover automatically. The admin can always change it later with "Set as Cover."

---

## How it is built (technical summary, simplified)

### The .NET API — three new endpoints

| Endpoint | What it does |
|---|---|
| `POST /api/admin/storage/upload` | Accepts a multipart file upload. Streams the file into the MinIO bucket at `albums/{albumId}/{fileId}.{ext}`. Returns the public URL via the existing `/api/storage/...` proxy endpoint. Auth-gated. |
| `POST /api/admin/albums/:id/media` | Inserts a `MediaItem` record into the database for a given album. Accepts `url`, `type`, `title`, `description`. If the album has no cover set, this also sets `coverUrl` to the new item's URL. Auth-gated. |
| `DELETE /api/admin/media/:id` | Deletes a `MediaItem` record and removes the underlying file from MinIO. If the deleted item was the album cover, the cover is reassigned to another item in the album (or cleared if none remain). Auth-gated. |

### The React adapter — implementing the media write methods

`DotNetAdapter` currently leaves `insertMedia`, `deleteMedia`, and `uploadFile` as `throw new Error("Not implemented")`. This phase fills them in with the same Bearer token pattern established in Phase 5.

### The AdminAlbum page

A new page at `/admin/albums/:id` (distinct from the album list at `/admin/albums`) showing:

- The album name, description, and current cover
- A drag-and-drop / click-to-select upload zone accepting images and videos
- A per-file upload queue with progress bars (pending, uploading, complete, failed states)
- A media grid of all items already in the album
- Per-item actions: **Set as Cover** and **Delete**

### React Query cache strategy

After a successful upload, `insertMedia` invalidates:
- `queryKeys.media(albumId)` — refreshes the media grid
- `queryKeys.albums()` and `queryKeys.album(albumId)` — refreshes cover URL and item count

After a delete, the same keys are invalidated so counts and cover stay accurate in both the Admin Panel and the public gallery.

---

## Local development prerequisites

Unlike earlier phases, Phase 6 requires three processes running simultaneously:

| Process | How to start | Default port |
|---|---|---|
| PostgreSQL | Already running as a Windows service (installed with the project) | 5432 |
| MinIO | `C:\minio\minio.exe server C:\minio\data --console-address ":9001"` | 9000 (API), 9001 (console) |
| .NET API | `cd server/Pixera.Api && dotnet run` | 5000 |
| Vite dev server | `cd client && npm run dev` | 8080 |

**One-time MinIO setup:** Open `http://localhost:9001`, log in with `minioadmin`/`minioadmin`, create a bucket named `pixera`.

**System environment variable check:** Run `printenv | grep VITE` in a terminal. If `VITE_USE_LOCAL_DATA=true` appears, remove it from Windows environment variables (Settings → System → About → Advanced system settings → Environment Variables). The `.env` file controls this setting — system vars take precedence and will override it.

---

## What "done" looks like for this phase

- An admin can upload multiple images and videos to an album in one operation
- Upload progress is shown per file (pending / uploading / complete / failed)
- Failed uploads show a per-file error message without blocking successful uploads
- An admin can delete a MediaItem — it disappears from the album in both AdminPanel and GalleryView
- An admin can set any MediaItem as the album cover
- The first MediaItem uploaded to an album with no cover is automatically set as the cover
- Uploaded files are stored in MinIO and accessible via the `/api/storage/...` proxy

---

## Issues encountered & solutions

| # | What went wrong | Why it happened | How it was fixed |
|---|---|---|---|
| 1 | Upload returned "Network error" in the browser | The .NET API had no CORS policy. Browsers allow simple GET requests cross-origin but block JavaScript from reading the response of cross-origin POST/multipart requests — `xhr.onerror` fires instead of `xhr.onload`. | Added `AddCors` + `UseCors()` to Program.cs allowing `localhost:8080` and `:5173`. Must be placed before `UseAuthentication` in the middleware pipeline. |
| 2 | "Manage Media" button on album rows did not navigate | `<Link><Button>` creates `<a><button>` in the DOM — nested interactive elements. The `<button>` absorbed the click before it could bubble to the `<a>` tag. | Replaced with `<Button asChild><Link>` — shadcn's `asChild` prop merges button styles onto the Link, producing a single `<a>` element with no nesting. |
| 3 | Client showed mock data (`album-001`, `album-002`) and albums created in the UI never appeared in Swagger or PostgreSQL | `VITE_USE_LOCAL_DATA=true` was set as a **Windows system environment variable**, which Vite gives higher priority than `.env` files. Every server restart still loaded the LocalAdapter regardless of the `.env` setting. Old Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) were also present as system vars — leftover from the pre-overhaul architecture. | Remove the system env vars in Windows: **Settings → System → About → Advanced system settings → Environment Variables** — delete `VITE_USE_LOCAL_DATA`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` from both User and System variable lists. Restart the terminal, then restart the Vite dev server. |
| 4 | No way to tell at a glance whether the admin was using real data or mock data | Nothing in the UI indicated which adapter was active. | Added a backend mode badge to the `AdminPanel` header: amber `Local data` pill when `VITE_USE_LOCAL_DATA=true`, green `API` pill when connected to the real backend. |
| 5 | MinIO was not running — uploads would have failed even after CORS was fixed | MinIO binary existed at `C:\minio\minio.exe` but was never started. The `pixera` bucket also did not exist yet. | Start MinIO: `C:\minio\minio.exe server C:\minio\data --console-address ":9001"`. Create the `pixera` bucket via the MinIO console at `http://localhost:9001` (login: `minioadmin` / `minioadmin`). |

---

## Key files introduced or changed in this phase

| File | What changed |
|---|---|
| `server/Pixera.Api/Program.cs` | Added `POST /api/admin/storage/upload`, `POST /api/admin/albums/:id/media`, `DELETE /api/admin/media/:id`, `PATCH /api/admin/albums/:id/cover` |
| `client/src/lib/adapter/dotnet.ts` | Implemented `uploadFile`, `insertMedia`, `deleteMedia`, `updateAlbumCover` |
| `client/src/pages/admin/AdminAlbumDetail.tsx` | New page — drag-and-drop upload zone, per-file XHR progress bars, media grid with hover actions |
| `client/src/pages/admin/AdminAlbums.tsx` | Added "Manage Media" icon link per album row |
| `client/src/App.tsx` | Registered `/admin/albums/:id` route |

---

## Concepts worth knowing for interviews

**What is object storage?**
Object storage treats every file as a flat "object" identified by a key (a path-like string). There are no folders — `albums/abc/photo.jpg` is just a key, not a real directory. You read and write objects over HTTP. It scales to petabytes without the performance issues of a traditional filesystem. S3, Azure Blob, GCS, and MinIO all work this way.

**What is multipart/form-data?**
When a browser uploads a file, it sends it as `multipart/form-data` — a special encoding that interleaves binary file contents with text fields in a single HTTP request body. The .NET minimal API reads it via `IFormFile`. The file is never fully loaded into memory; it is streamed directly to MinIO.

**What is concurrent uploading and why does it matter?**
Uploading files one at a time is safe but slow. Uploading all files simultaneously saturates the network. Concurrent uploading (e.g. three files at once) balances throughput against server load. In the browser this is done by firing multiple `fetch` calls simultaneously and using `Promise.allSettled` so that a failure on one does not cancel the others.

**What is `Promise.allSettled` vs `Promise.all`?**
`Promise.all` rejects as soon as *any* promise fails — one bad upload would kill all others. `Promise.allSettled` waits for every promise to finish regardless, then gives you an array of results tagged as `fulfilled` or `rejected`. This is the right choice for bulk operations where partial success is acceptable and expected.

**What does "set as cover" involve technically?**
Setting a cover is a `PUT /api/admin/albums/:id` call (the same update endpoint from Phase 5) with only `coverUrl` changing. The existing `updateAlbum` adapter method handles it. After the call, invalidating `queryKeys.albums()` ensures the new cover appears in the album list without a page refresh.

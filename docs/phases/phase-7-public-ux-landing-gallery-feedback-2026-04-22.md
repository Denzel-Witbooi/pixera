# Phase 7 — Public UX: Landing page, gallery redesign & feedback system
**Date:** 2026-04-22
**Branch:** `feature/landing-page` (merged to main)
**GitHub Issues:** [#12](https://github.com/Denzel-Witbooi/pixera/issues/12), [#13](https://github.com/Denzel-Witbooi/pixera/issues/13), [#14](https://github.com/Denzel-Witbooi/pixera/issues/14), [#15](https://github.com/Denzel-Witbooi/pixera/issues/15) (all closed)
**Status:** Complete

---

## What this phase is about (plain English)

Phases 1-6 focused on the backend and the admin section. By the end of Phase 6, an admin could log in, create albums, upload media, and the public gallery worked. But the app had no real entry point — visiting `/` hit the old Supabase-era protected route, the gallery pages looked rough, and there was no way for users to report bugs or send feedback without emailing someone directly.

This phase built out the entire public-facing experience:

- A proper **landing page** at `/` — the first thing any user or organization member sees
- A **gallery redesign** — the album detail page no longer opens with a large cropped cover banner; instead it shows the album title, description, and action buttons at the top, with all media items in a clean grid below
- A **shared feedback system** — a floating button on every public page that opens a form; submissions create real GitHub issues in the repository automatically
- **Dead code removal** — 14 Supabase-era files that were still in the codebase were deleted, making the repo significantly cleaner
- **Fix: broken images and downloads** — media URLs were relative (`/api/storage/…`) and the browser was resolving them against the Vite dev server (port 8080) instead of the .NET API (port 5000). A `resolveMediaUrl()` utility was added to prepend the correct base URL everywhere.
- **Fix: clean slug-based URLs** — gallery and admin pages were using GUIDs in URLs (`/gallery/3f8a...`). Now they use human-readable slugs (`/gallery/team-day-2025`). A unique index on the `slug` column with counter-based collision handling ensures no two albums share a slug.

---

## Key decisions explained (plain English)

### Why a feedback FAB instead of an inline form section?

The first implementation had the feedback form as a full section at the bottom of the landing page. This felt heavy — it forced users to scroll past it even if they had no intention of using it, and it took up real estate on a page where the only goals are "browse the gallery" or "log in as admin."

A floating action button (FAB) sits in the corner of the screen on every page and is visible only when needed. It takes up no layout space and follows the user as they scroll. Clicking it opens a modal dialog — the form only appears when the user explicitly asks for it.

| Approach | Pros | Cons |
|---|---|---|
| Inline section on landing page | Always visible, no interaction needed to find it | Takes up screen space, not present on other pages |
| FAB + modal (chosen) | Always reachable, zero layout cost, present on all public pages | Requires one click to access |

### Why does the feedback form create a GitHub issue?

The alternatives were:
- **Email** — requires an SMTP server, goes to a mailbox no one checks
- **Third-party services** (Formspree, Mailchimp, etc.) — external dependency, costs money at scale, data leaves the system
- **Database table** — requires building an admin UI to read submissions

Using the GitHub Issues API means feedback lands directly in the same place the code lives. The category (Bug report, Feature request, General) maps to a GitHub label automatically. No new infrastructure, no third-party service, no additional UI needed.

The GitHub personal access token is stored in `appsettings.Development.json` (git-ignored) and accessed via `configuration["GitHub:Token"]` in the .NET API.

### Why remove the hero cover banner on album pages?

The original album detail page showed the cover image as a full-width `aspect-[21/6]` banner with the album title overlaid on it. Problems:

1. **Crops the image badly** — a wide, short banner crops portrait or square images so severely that the subject is often unrecognisable
2. **Buries the actual content** — users come to see the photos; the hero banner delays getting to the grid
3. **Redundant** — the cover is already shown on the gallery home page card, so showing it again on the detail page adds no new information

The replacement is an editorial-style header: title, description, date, item count, then action buttons (Download all, Share album). The media grid starts immediately below.

### Why remove the "Gallery" nav link from the gallery page?

When a user is on `/gallery`, having a "Gallery" link in the navigation bar points to the page they are already on. It is visually confusing (does clicking it refresh? Does it go somewhere different?) and adds noise. The logo in the header always links back to `/` (home), which is enough for top-level navigation. Back navigation between album detail and the gallery list is handled by the browser's back button or by navigating back to `/gallery` via a direct URL.

### Why keep `resolveMediaUrl()` as a utility instead of fixing it at the API level?

The cleanest fix would be for the .NET API to return fully-qualified URLs (e.g., `http://localhost:5000/api/storage/…`) instead of relative paths. However, the API doesn't know what hostname the client is running on — in production it might be `https://pixera.example.com/api/storage/…`, in local dev it's `localhost:5000`. Returning absolute URLs would require environment-specific configuration on the server.

`resolveMediaUrl()` on the client reads `VITE_API_URL` (already an existing env var) and prepends it to any relative path. This keeps the server environment-agnostic and consolidates all URL resolution in one place.

---

## Files changed

### New files
| File | Purpose |
|---|---|
| `client/src/pages/Home.tsx` | Landing page at `/` |
| `client/src/components/PublicHeader.tsx` | Shared header for all public pages (logo + optional actions) |
| `client/src/components/FeedbackFAB.tsx` | Feedback floating button + modal (shared, used on all public pages) |

### Modified files
| File | What changed |
|---|---|
| `client/src/App.tsx` | Removed auth providers, legacy routes; added Home + clean admin routes |
| `client/src/pages/GalleryHome.tsx` | Fixed gradient overlay structure; added FeedbackFAB |
| `client/src/pages/GalleryAlbum.tsx` | Removed hero banner; editorial header with title/desc/metadata/actions; FeedbackFAB; consolidated to sonner toasts |
| `client/src/lib/utils.ts` | Added `resolveMediaUrl()` |
| `client/src/components/carousel/useCarouselDownload.tsx` | Applied `resolveMediaUrl` before fetching download |
| `client/src/lib/buildAlbumZip.ts` | Applied `resolveMediaUrl` before fetching zip files |
| `client/src/lib/adapter/types.ts` | Added `fetchAlbumBySlug` to DataAdapter interface; added `queryKeys.albumSlug` |
| `client/src/lib/adapter/dotnet.ts` | Implemented `fetchAlbumBySlug` via `GET /api/albums/slug/{slug}` |
| `client/src/lib/adapter/local.ts` | Implemented `fetchAlbumBySlug` via `localStore.getAlbumBySlug` |
| `client/src/lib/local-store.ts` | Added `getAlbumBySlug()` |
| `server/Pixera.Api/Program.cs` | Added `GET /api/albums/slug/{slug}`; `POST /api/feedback`; slug collision handling |
| `server/Pixera.Api/Data/AppDbContext.cs` | Unique index on `albums.slug` |
| `.gitignore` | Added `server/**/appsettings.Development.json` |

### Deleted files (dead code)
14 Supabase-era files removed: `Index.tsx`, `Auth.tsx`, `Album.tsx`, `CreateAlbum.tsx`, `Header.tsx`, `AlbumGrid.tsx`, `AlbumCard.tsx`, `DeleteAlbumDialog.tsx`, `EditAlbumDialog.tsx`, `UploadModal.tsx`, `ViewAlbum.tsx`, `LoadingOverlay.tsx`, `MediaItemActions.tsx`, `AuthContext.tsx`

---

## Issues hit along the way

### Issue 1: VS Code / Cursor integrated terminal injecting root `.env`
**Symptom:** The admin panel was showing the "Local data" amber pill even after setting `VITE_USE_LOCAL_DATA=false` in `client/.env`.  
**Root cause:** Cursor's integrated terminal automatically injects the workspace root `.env` into every shell session. A stale root-level `.env` file was overriding `client/.env` silently — Vite picks up whichever env file it finds first.  
**Fix:** Run `npm run dev` from a terminal opened outside VS Code/Cursor. The CLAUDE.md now documents this explicitly.

### Issue 2: Broken images and corrupted downloads
**Symptom:** Images on the gallery page appeared broken (404). Downloaded files were corrupt (HTML 404 page saved as `.jpg`).  
**Root cause:** Media URLs from the API are relative paths like `/api/storage/bucketname/filename.jpg`. The browser resolves these against the current page origin — which in dev is `localhost:8080` (Vite). The actual file is on `localhost:5000` (.NET API).  
**Fix:** `resolveMediaUrl()` prepends `VITE_API_URL` to any path starting with `/`. Applied in the gallery components, the carousel download hook, and the ZIP builder.

### Issue 3: `appsettings.Development.json` was tracked by git
**Symptom:** After adding the file to `.gitignore`, `git status` still showed it as modified.  
**Root cause:** The file was already tracked by git before the `.gitignore` entry was added. Git ignores only untracked files.  
**Fix:** `git rm --cached server/Pixera.Api/appsettings.Development.json` removes it from the index without deleting it from disk.

### Issue 4: Merge conflict with remote main
**Symptom:** Pushing merged main was rejected — remote had diverged (1 commit ahead, 25 behind).  
**Root cause:** The remote's main branch had a stale state from an earlier phase (Phase 4) that hadn't been fully reconciled with the local history built across sessions.  
**Fix:** `git pull --no-rebase` followed by resolving all conflicts by keeping the current (HEAD) versions, which are the correct, up-to-date implementations.

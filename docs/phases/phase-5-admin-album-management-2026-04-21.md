# Phase 5 — Admin Album Management
**Date:** 2026-04-21
**Branch:** `phase-5/admin-album-management` *(committed on `phase-4/admin-keycloak-auth` pending merge to main)*
**GitHub Issue:** [#7](https://github.com/Denzel-Witbooi/pixera/issues/7)
**Status:** Complete

---

## What this phase is about (plain English)

Phase 4 built the lock on the admin section — you can log in, and all write endpoints are auth-gated. But there was nothing to do once you got in.

This phase adds the first real admin capability: managing albums. An admin can open the Admin Panel, see every album at a glance, create new ones, rename or redescribe existing ones, delete ones that are no longer needed, and copy a shareable link to send to guests. The public gallery updates immediately — no cache clearing, no manual refresh. Create an album and it appears; delete one and it vanishes.

---

## Why slug design matters (the decision, in plain English)

### What is a slug?

A slug is the human-readable part of a URL. Instead of `/gallery/d2b3c9ef-...`, you get `/gallery/d2b3c9ef-abc.../summer-wedding-2026`. The slug makes links readable, shareable, and meaningful to the person receiving them.

### Why auto-generate the slug on creation and never change it?

This is a deliberate, opinionated decision — here is the reasoning:

| Option | Tradeoff |
|---|---|
| **Let the admin set the slug manually** | More control, but also more room for typos, blank slugs, and inconsistency. Admins have to think about it. |
| **Regenerate the slug every time the title changes** | Simpler to reason about, but it *breaks every link that was already shared*. If someone bookmarked `/gallery/.../summer-wedding`, that link dies when the admin renames the album. |
| **Auto-generate on creation and lock it** | ✅ Chosen. The slug is set once from the title, stored in the database, and never touched again. Admins can freely rename and redescribe albums without fear of breaking shared links. |

This is the same approach used by major publishing platforms (Medium, Substack, dev.to) — the URL is derived from the original title but does not track subsequent edits.

### How slugs are generated

The `SlugGenerator` utility on the .NET side:
1. Normalises Unicode (strips accents — é becomes e)
2. Lowercases everything
3. Strips all characters that are not letters, digits, spaces, or hyphens
4. Collapses runs of whitespace and hyphens into a single hyphen
5. Trims leading and trailing hyphens

`"Summer Wedding 2026!"` → `"summer-wedding-2026"`

---

## How it is built (technical summary, simplified)

### The .NET API — three new write endpoints

All three live under `/api/admin/...` which is protected by the `RequireAuthorization()` group set up in Phase 4. In Development, the DevBypass handler authenticates every request automatically; in Production, a valid Keycloak JWT is required.

| Endpoint | What it does |
|---|---|
| `POST /api/admin/albums` | Creates a new album. Accepts `title` and `description`. The server generates the `id`, `slug`, `createdAt`, and `userId`. Returns the full album object. |
| `PUT /api/admin/albums/{id}` | Updates `title` and `description` on an existing album. The `slug` is never touched. Returns `204 No Content`. |
| `DELETE /api/admin/albums/{id}` | Deletes the album and all of its media items (cascade is handled by the database). Returns `204 No Content`. |

### The React adapter — implementing the write methods

`DotNetAdapter` previously left `createAlbum`, `updateAlbum`, and `deleteAlbum` as `throw new Error("Not implemented")`. This phase fills them in.

Each write method:
1. Reads `keycloak.token` from the singleton instance set up in Phase 4
2. Includes it as `Authorization: Bearer <token>` in the request header
3. Falls back gracefully if no token is present (works in Development without Keycloak running)

### The AdminAlbums page

A new page at `/admin/albums` showing:
- A list of every album with its cover thumbnail, title, and media item count
- A **New Album** button that opens a create dialog
- Per-album **Edit**, **Delete**, and **Copy Link** actions

The create and edit flows share a single `AlbumFormDialog` component — both show the same title and description fields; the only difference is the heading and button label.

After any write operation, React Query's `invalidateQueries` ensures the list re-fetches automatically — no manual state management needed.

### The shareable link

The Copy Link button writes `https://<origin>/gallery/<id>/<slug>` to the clipboard using the browser's native `navigator.clipboard` API. A `/gallery/:id/:slug` route was added to React Router so these pretty URLs resolve correctly. The `GalleryAlbum` component reads only the `:id` segment, so the slug is purely decorative in the URL.

---

## What "done" looks like for this phase

- An admin can create a new album — it appears in both the Admin Panel and the public gallery immediately
- Slug is auto-generated from the album name at creation and cannot be changed by editing
- An admin can edit an album's title and description without affecting its slug
- An admin can delete an album — it disappears from both views; media is also removed
- "Copy Shareable Link" writes the correct `/gallery/:id/:slug` URL to the clipboard
- The album list shows cover image, title, and media item count for each album
- All write operations require a valid Keycloak token in non-Development environments

---

## Issues encountered & solutions

| # | What went wrong | Why it happened | How it was fixed |
|---|---|---|---|
| 1 | Phase 5 work was committed on the `phase-4/admin-keycloak-auth` branch | Phase 4 was finished but not yet merged; work continued on the same branch rather than cutting a new one | Noted in this document. Branch should be merged to `main` and a `phase-5/admin-album-management` branch created for future reference. |

---

## Key files introduced or changed in this phase

| File | What changed |
|---|---|
| `server/Pixera.Api/Program.cs` | Added `POST`, `PUT`, `DELETE` endpoints under `/api/admin/albums` |
| `client/src/lib/adapter/dotnet.ts` | Implemented `createAlbum`, `updateAlbum`, `deleteAlbum` with Bearer token headers |
| `client/src/pages/admin/AdminAlbums.tsx` | New page — album list, create/edit/delete dialogs, copy link action |
| `client/src/App.tsx` | Registered `/admin/albums` route; added `/gallery/:id/:slug` route for pretty shareable links |

---

## Concepts worth knowing for interviews

**What is a REST resource and why does the URL shape matter?**
REST treats data as "resources" with stable URLs. `/api/admin/albums` is the collection; `/api/admin/albums/{id}` is a single item. The HTTP verb (`GET`, `POST`, `PUT`, `DELETE`) says what you want to do with it. This makes APIs predictable — any developer who sees the URL shape immediately understands what operations are available.

**Why `204 No Content` instead of returning the updated object?**
`PUT` and `DELETE` return `204` here because the client already knows what it sent. Returning the full object again wastes bandwidth and adds server work for no benefit. The client invalidates its cache and re-fetches the list if it needs fresh data. This is idiomatic REST.

**What is cascade delete?**
When you delete an album, all of its media items should disappear too — you would never want orphaned rows in the database pointing at an album that no longer exists. Entity Framework's `OnDelete(DeleteBehavior.Cascade)` tells the database to automatically delete child rows when the parent is deleted. This was configured in Phase 1 and just works here for free.

**What is React Query cache invalidation?**
React Query keeps a client-side cache of server data indexed by query keys. After a mutation (create, update, delete), the client calls `invalidateQueries` on the relevant key. React Query marks that data as stale and immediately re-fetches it in the background. The user sees the updated list without a page refresh and without the developer manually managing state.

**What is the clipboard API?**
`navigator.clipboard.writeText(url)` is a modern browser API that copies text to the system clipboard. It returns a Promise — if the browser denies permission (e.g. the page is not focused), it rejects, and the app shows an error toast instead of silently failing.

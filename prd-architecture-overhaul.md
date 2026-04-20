# PRD: Architecture Overhaul — .NET Backend, Keycloak Auth, Split Gallery/Admin Views

## Problem Statement

Pixera is currently built as a single-view React app backed entirely by Supabase (auth, database, and file storage). This creates several compounding problems for a Viewer and Admin:

- A Viewer browsing public galleries encounters auth UI, login prompts, and "sign in to view albums" friction — despite galleries being intended as fully public.
- An Admin's management tools (upload, edit, delete) are conditionally hidden from Viewers via JavaScript flags, but the underlying code is still shipped to every Viewer's browser.
- Supabase owns the entire backend, making it impossible to add custom business logic, swap infrastructure, or scale specific concerns independently.
- There is no clear separation between the public-facing product and the internal management tooling — making future feature additions risky and the codebase harder to reason about.
- File storage is locked to Supabase Storage with no path to self-hosting or cost-free alternatives.

## Solution

Restructure Pixera into two clearly separated experiences within the same codebase:

1. **GalleryView** (`/gallery/*`) — a fully public, zero-auth interface where any Viewer can browse Albums and MediaItems, or open a specific Album via a ShareableLink. No login UI, no auth concepts exist in this part of the app.

2. **AdminPanel** (`/admin/*`) — a Keycloak-authenticated interface where Admins manage Albums, upload MediaItems, and control the platform. This code is lazy-loaded and completely absent from the GalleryView bundle.

Replace Supabase entirely with:
- **.NET Minimal API** as the backend
- **PostgreSQL** (local and production) managed via EF Core migrations
- **MinIO** for self-hosted, S3-compatible file storage
- **Keycloak** for Admin authentication
- A new **DotNetAdapter** in the React frontend replacing the SupabaseAdapter

## User Stories

### Viewer (public, unauthenticated)

1. As a Viewer, I want to see all public Albums on the GalleryView home page, so that I can browse available event media without needing to sign in.
2. As a Viewer, I want to open an Album and see all its MediaItems, so that I can view the photos and videos from an event.
3. As a Viewer, I want to view a MediaItem in fullscreen, so that I can see it in full detail.
4. As a Viewer, I want to navigate between MediaItems in fullscreen using keyboard arrow keys, so that I can browse efficiently without using a mouse.
5. As a Viewer, I want to download a single MediaItem, so that I can save a specific photo or video.
6. As a Viewer, I want to download all MediaItems in an Album as a ZIP archive, so that I can save the entire event collection at once.
7. As a Viewer, I want to open a ShareableLink I received and land directly on the correct Album, so that I don't have to search for it.
8. As a Viewer, I want the ShareableLink URL to contain the Album name in a readable format (e.g. `/gallery/abc123/company-christmas-2025`), so that I understand what the link is about before clicking.
9. As a Viewer, I want to see the Album's cover image, name, and MediaItem count on the GalleryView home page, so that I can identify albums at a glance.
10. As a Viewer, I want the GalleryView to load quickly without any auth redirects or login checks, so that I have a seamless browsing experience.
11. As a Viewer, I want the GalleryView to work on mobile devices, so that I can browse galleries from my phone.
12. As a Viewer, I want a 404 page if a ShareableLink points to a non-existent Album, so that I receive clear feedback instead of a broken screen.

### Admin (authenticated)

13. As an Admin, I want to be redirected to the Keycloak login page when I navigate to `/admin` without an active session, so that the AdminPanel is never exposed to unauthenticated users.
14. As an Admin, I want to be returned to the AdminPanel automatically after logging in via Keycloak, so that I don't lose my place.
15. As an Admin, I want to log out and end my Keycloak session, so that my account is secure on shared machines.
16. As an Admin, I want to create a new Album with a name, optional description, and optional cover image, so that I can organise media by event.
17. As an Admin, I want the Album's Slug to be auto-generated from its name at creation time, so that ShareableLinks are immediately human-readable without extra steps.
18. As an Admin, I want to edit an existing Album's name and description, so that I can correct mistakes or update event details.
19. As an Admin, I want to delete an Album and all its associated MediaItems, so that I can remove outdated or incorrect events.
20. As an Admin, I want to upload multiple images and videos to an Album in one operation, so that I can populate an event album efficiently.
21. As an Admin, I want to see upload progress for each file during a bulk upload, so that I know which files are pending, uploading, and complete.
22. As an Admin, I want failed uploads to be clearly indicated with an error message per file, so that I can retry specific files without re-uploading the entire batch.
23. As an Admin, I want to delete individual MediaItems from an Album, so that I can remove duplicates or unwanted photos.
24. As an Admin, I want to set any MediaItem within an Album as the Album's Cover, so that the Album has an appropriate thumbnail in the GalleryView.
25. As an Admin, I want the first uploaded MediaItem to automatically become the Cover if no Cover has been set, so that Albums always have a thumbnail.
26. As an Admin, I want to copy the ShareableLink for any Album to my clipboard, so that I can easily share it via WhatsApp, email, or any other channel.
27. As an Admin, I want to view all Albums in the AdminPanel with their MediaItem count and Cover, so that I have an overview of all platform content.
28. As an Admin, I want the AdminPanel to be completely absent from the GalleryView JavaScript bundle, so that admin-only code is never exposed to Viewers.

### System / Platform

29. As a developer, I want the local development environment to run without Keycloak active, using a mock JWT flag, so that the dev feedback loop is fast.
30. As a developer, I want to switch from local PostgreSQL to a production PostgreSQL instance by changing a single environment variable, so that deployments are simple.
31. As a developer, I want to switch from local MinIO to a cloud-compatible S3 endpoint by changing a single environment variable, so that storage is portable.
32. As a developer, I want all database schema changes managed via EF Core migrations, so that schema history is version-controlled and reproducible.
33. As a developer, I want the React frontend's DataAdapter interface to remain unchanged, so that swapping between LocalAdapter and DotNetAdapter requires no component-level changes.

## Implementation Decisions

### Repository Structure

- Monorepo with two top-level directories: `client/` (React app) and `server/` (.NET solution)
- A single `docker-compose.yml` at the root for VPS deployment (PostgreSQL, Keycloak, MinIO, .NET API)
- Native service installs for local development (no Docker required on developer machines)

### Frontend — Route Split

- `/gallery/*` routes are rendered without any auth provider or admin component imports
- `/admin/*` routes are lazy-loaded via `React.lazy()` and wrapped in a `KeycloakProvider`
- Admin components live under `src/pages/admin/` and `src/components/admin/` — never imported by gallery routes
- The Vite bundler naturally tree-shakes admin code out of the GalleryView chunk

### Frontend — Authentication

- `KeycloakProvider` (using `keycloak-js`) wraps only the `/admin/*` subtree
- On initialisation, if no valid Keycloak token exists, the provider redirects to the Keycloak login page
- After login, Keycloak returns a JWT access token stored in memory (not localStorage)
- `keycloak-js` handles silent token refresh automatically
- `AuthContext.tsx`, `signIn()`, `signUp()`, `isPublicView`, and all Supabase auth references are removed entirely

### Frontend — Data Layer

- `DataAdapter` interface in `src/lib/adapter/types.ts` remains unchanged
- `SupabaseAdapter` is removed entirely
- `LocalAdapter` is retained for offline development (`VITE_USE_LOCAL_DATA=true`)
- `DotNetAdapter` is added: implements `DataAdapter` by calling the .NET API via `fetch`, attaching `Authorization: Bearer <token>` on all write operations (admin routes only)
- `VITE_API_BASE_URL` environment variable controls the API endpoint

### Frontend — Shareable URLs

- Album route pattern: `/gallery/:id/:slug`
- Slug is generated from album name at creation (lowercase, hyphenated, non-alphanumeric stripped)
- The `:id` resolves the Album; the `:slug` is cosmetic — renaming an Album never breaks existing ShareableLinks

### Backend — .NET Minimal API

- Three endpoint groups: `AlbumEndpoints`, `MediaEndpoints`, `StorageEndpoints`
- Public endpoints (GET album, GET media, GET file): no auth required
- Write endpoints (POST, PUT, DELETE): require a valid Keycloak JWT (`Authorization: Bearer`)
- In `Development` environment: JWT validation is bypassed and all requests are treated as authenticated Admin
- In `Staging` and `Production`: JWT validated against Keycloak's JWKS endpoint

### Backend — Database

- PostgreSQL for both local and production
- ORM: EF Core with Npgsql provider
- Schema managed via EF Core code-first migrations
- Connection string injected via `DATABASE_URL` environment variable
- Tables: `albums` (id, name, slug, description, cover_url, created_at, created_by), `media_items` (id, album_id, url, media_type, filename, file_size, created_at)
- `profiles` table removed — identity ownership transfers to Keycloak

### Backend — File Storage

- MinIO (S3-compatible, open-source) for file storage
- .NET backend uses the AWS SDK for S3 pointed at MinIO endpoint
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` environment variables control storage target
- Switching to Cloudflare R2 or any S3-compatible provider requires only environment variable changes
- Public file access served via `.NET GET /api/storage/:path` endpoint streaming from MinIO

### Backend — API Contract

- `GET /api/albums` → `Album[]` (public)
- `GET /api/albums/:id` → `Album` (public)
- `POST /api/albums` → `Album` (admin)
- `PUT /api/albums/:id` → `Album` (admin)
- `DELETE /api/albums/:id` (admin)
- `PUT /api/albums/:id/cover` (admin)
- `GET /api/albums/:id/media` → `MediaItem[]` (public)
- `POST /api/albums/:id/media` (admin)
- `DELETE /api/media/:id` (admin)
- `POST /api/storage/upload` → `{ url: string }` (admin)
- `GET /api/storage/:path` → file stream (public)

### Authentication — Keycloak

- Keycloak runs natively (`kc.bat start-dev`) for local staging/testing
- Admin users and roles are managed exclusively via the Keycloak admin console — no custom user management UI in the AdminPanel
- Keycloak stores its own state in the shared PostgreSQL instance

## Testing Decisions

A good test validates external behaviour through the module's public interface and does not assert on internal implementation details (private methods, internal state, specific SQL queries). Tests should remain valid through refactors that preserve behaviour.

### Modules to test

- **AlbumSlug utility** — pure function, unit tested: given an album name, assert the correct slug is produced. Edge cases: special characters, unicode, very long names, names that produce duplicate slugs.
- **DotNetAdapter** — integration tested against a running .NET API instance: assert each adapter method produces the correct HTTP request and correctly maps the response to the `Album` or `MediaItem` domain type.
- **AlbumEndpoints / MediaEndpoints** — integration tested against a real PostgreSQL test database (not mocked): assert that create, read, update, and delete operations produce the correct database state and HTTP responses.
- **StorageEndpoints** — integration tested against a real MinIO test instance: assert that upload produces a retrievable URL and that the file is accessible via the GET endpoint.
- **JWT middleware** — unit tested: assert that requests without a valid token are rejected with 401 in Staging/Production environments, and that all requests are accepted in Development environment.
- **KeycloakProvider** — tested via React Testing Library: assert that navigating to `/admin/*` without a token triggers a redirect, and that admin components render once a mock token is present.

### Prior art

There is currently zero test coverage in the codebase. These tests establish the first testing patterns for the project. The adapter pattern makes backend integration tests tractable — each test instantiates a `DotNetAdapter` pointed at a test API server, calls adapter methods, and asserts on the returned domain objects.

## Out of Scope

- Custom Admin user management UI (Keycloak admin console handles user and role creation)
- Per-album visibility settings (private vs public Albums)
- Email or push notifications
- Comments, reactions, or social features on MediaItems
- Video transcoding or thumbnail generation from video files
- Analytics, view counts, or download tracking
- Multi-tenancy (multiple organisations sharing one Pixera instance)
- Mobile native apps

## Further Notes

- The existing `LocalAdapter` and mock data (`src/lib/mock-data.ts`) are retained as the offline development baseline. Developers can build and test GalleryView and AdminPanel UI without any backend services running.
- MinIO's web UI (available at `localhost:9001` during local development) provides direct visibility into uploaded files — useful for debugging storage issues.
- The Slug is generated at Album creation and never mutated. If an Admin renames an Album, the Slug and all existing ShareableLinks remain valid.
- CORS must be configured on the .NET API to allow requests from the React dev server origin (`localhost:8080`) and the production frontend domain.

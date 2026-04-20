# Plan: Architecture Overhaul — .NET Backend, Keycloak Auth, Split Gallery/Admin Views

> Source PRD: https://github.com/Denzel-Witbooi/pixera/issues/2

## Architectural decisions

- **Routes**: `/gallery/*` — public, no auth. `/admin/*` — Keycloak-protected, lazy-loaded.
- **Schema**: `albums` (id, name, slug, description, cover_url, created_at, created_by), `media_items` (id, album_id, url, media_type, filename, file_size, created_at)
- **Key models**: Album, MediaItem, ShareableLink (`/gallery/:id/:slug`)
- **Auth**: Keycloak (admin only via `keycloak-js`). Dev environment uses mock JWT bypass. GalleryView has zero auth concepts.
- **Storage**: MinIO (S3-compatible). Endpoint/credentials injected via environment variables.
- **Backend**: .NET Minimal API — three endpoint groups: AlbumEndpoints, MediaEndpoints, StorageEndpoints.
- **Frontend adapters**: `LocalAdapter` (offline dev) + `DotNetAdapter` (production). `DataAdapter` interface unchanged. Supabase removed entirely.
- **Repo layout**: Monorepo — `client/` (React app), `server/` (.NET solution).

---

## Phase 1: Monorepo + .NET skeleton + public album list

**User stories**: 1, 9, 33

### What to build

Restructure the repo into `client/` and `server/`. Create a .NET Minimal API project with PostgreSQL via EF Core — including the initial `albums` table migration. Implement `GET /api/albums` returning all albums. Add `DotNetAdapter` to the React frontend and wire it into the existing gallery home page so albums render from the .NET API end-to-end.

### Acceptance criteria

- [ ] React app lives under `client/`, .NET solution under `server/`
- [ ] `dotnet run` starts the API and `GET /api/albums` returns a JSON array of albums from PostgreSQL
- [ ] `DotNetAdapter.fetchAlbums()` calls the API and maps the response to the `Album` domain type
- [ ] Gallery home page displays albums sourced from the .NET API when `VITE_USE_LOCAL_DATA=false`
- [ ] `LocalAdapter` still works when `VITE_USE_LOCAL_DATA=true`
- [ ] Supabase packages and `SupabaseAdapter` are removed from the codebase

---

## Phase 2: Public GalleryView — shareable album pages

**User stories**: 2, 7, 8, 10, 12

### What to build

Establish the `/gallery/*` route namespace. Add slug generation (from album name at creation time) to the schema and API. Implement `GET /api/albums/:id` and `GET /api/albums/:id/media` endpoints. Build the `/gallery/:id/:slug` page in React showing the album's MediaItem grid. Add a 404 page for non-existent album IDs.

### Acceptance criteria

- [ ] Navigating to `/gallery/:id/:slug` renders the correct album and its MediaItems
- [ ] The slug in the URL matches the album name (e.g. "Company Christmas 2025" → `company-christmas-2025`)
- [ ] Changing the album name does NOT change the slug or break existing links (slug is immutable)
- [ ] Navigating to `/gallery/:id/any-slug` with a non-existent ID renders a 404 page
- [ ] No login prompt, auth redirect, or auth-related UI appears anywhere in `/gallery/*`
- [ ] Gallery home at `/gallery` lists all albums with cover image, name, and MediaItem count

---

## Phase 3: Viewer media — fullscreen + downloads

**User stories**: 3, 4, 5, 6, 11

### What to build

Set up MinIO locally and implement `GET /api/storage/:path` in .NET to stream files from MinIO. Build fullscreen carousel in the GalleryView with keyboard arrow-key navigation. Implement single MediaItem download and full-album ZIP archive download. Verify the GalleryView is usable on mobile screen sizes.

### Acceptance criteria

- [ ] Clicking a MediaItem opens a fullscreen overlay
- [ ] Left/right arrow keys navigate between MediaItems in fullscreen
- [ ] A Viewer can download a single MediaItem directly
- [ ] A Viewer can download all MediaItems in an Album as a ZIP archive
- [ ] Files are served from MinIO via the .NET storage endpoint
- [ ] GalleryView is functional on mobile (touch navigation, readable layout)

---

## Phase 4: Admin foundation — Keycloak + protected routes

**User stories**: 13, 14, 15, 28, 29

### What to build

Create the `/admin/*` route namespace as a lazy-loaded chunk in React. Wrap it with `KeycloakProvider` (`keycloak-js`). Unauthenticated access to any `/admin` route redirects to the Keycloak login page. After login, the user lands on a basic AdminPanel shell. Sign out ends the Keycloak session. In the .NET API, write endpoints accept requests freely in `Development` environment (mock JWT) and validate Keycloak JWTs in `Staging`/`Production`.

### Acceptance criteria

- [ ] Navigating to `/admin` without a Keycloak session redirects to the Keycloak login page
- [ ] After logging in, the user is returned to the AdminPanel
- [ ] Sign out ends the session and redirects away from `/admin`
- [ ] Admin route components do not appear in the GalleryView JavaScript bundle (verify via build output)
- [ ] .NET API write endpoints return 401 for unauthenticated requests in non-Development environments
- [ ] .NET API accepts all requests in `Development` environment without a token

---

## Phase 5: Admin album management

**User stories**: 16, 17, 18, 19, 26, 27

### What to build

Implement `POST /api/albums`, `PUT /api/albums/:id`, and `DELETE /api/albums/:id` endpoints in .NET (auth-gated). Build the AdminPanel album list with cover thumbnail and MediaItem count. Build create, edit, and delete Album flows in the AdminPanel UI. Slug is auto-generated from album name at creation and never changes. Add a "Copy ShareableLink" action that writes the `/gallery/:id/:slug` URL to the clipboard.

### Acceptance criteria

- [ ] An Admin can create a new Album — it appears in both the AdminPanel and GalleryView immediately
- [ ] Slug is auto-generated from album name and stored at creation time
- [ ] An Admin can edit an Album's name and description without changing its slug
- [ ] An Admin can delete an Album — it disappears from both views
- [ ] "Copy ShareableLink" writes the correct `/gallery/:id/:slug` URL to the clipboard
- [ ] AdminPanel album list shows cover image, name, and MediaItem count for each Album
- [ ] All write operations require a valid Keycloak token in non-Development environments

---

## Phase 6: Admin media management

**User stories**: 20, 21, 22, 23, 24, 25

### What to build

Implement `POST /api/storage/upload` (file upload to MinIO) and `POST /api/albums/:id/media` (insert MediaItem record) and `DELETE /api/media/:id` endpoints. Build bulk upload UI in the AdminPanel with per-file progress indicators and per-file error states. Add delete MediaItem action. Add "Set as Cover" action per MediaItem. Auto-assign the first uploaded MediaItem as Cover if none is set.

### Acceptance criteria

- [ ] An Admin can upload multiple images and videos to an Album in one operation
- [ ] Upload progress is shown per file (pending / uploading / complete / failed)
- [ ] Failed uploads show an error message and do not block successful uploads
- [ ] An Admin can delete a MediaItem — it is removed from the album in both views
- [ ] An Admin can set any MediaItem as the Album Cover
- [ ] The first MediaItem uploaded to an Album with no Cover is automatically set as the Cover
- [ ] Uploaded files are stored in MinIO and publicly accessible via the storage endpoint

---

## Phase 7: Production hardening

**User stories**: 30, 31, 32

### What to build

Configure CORS on the .NET API for the production frontend domain. Write a `docker-compose.yml` that starts PostgreSQL, Keycloak, MinIO, and the .NET API on the VPS. Document all environment variables in a root-level `.env.example`. Verify real Keycloak JWT validation works end-to-end in the `Staging` environment. Run EF Core migrations on the production PostgreSQL instance.

### Acceptance criteria

- [ ] `docker-compose up` on the VPS starts all services cleanly
- [ ] The React GalleryView is accessible publicly and loads albums from the live API
- [ ] `/admin` redirects to real Keycloak and grants access only with valid credentials
- [ ] Switching `DATABASE_URL` is the only change needed to point to a different PostgreSQL instance
- [ ] Switching `MINIO_ENDPOINT` and credentials is the only change needed to point to a different S3-compatible store
- [ ] A `.env.example` at the repo root documents every required environment variable
- [ ] EF Core migrations run cleanly against a fresh PostgreSQL database with `dotnet ef database update`

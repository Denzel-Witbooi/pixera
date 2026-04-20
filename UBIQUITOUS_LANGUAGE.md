# Ubiquitous Language

## People

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Viewer** | A person browsing galleries publicly without any authentication | Client, public user, guest, end-user |
| **Admin** | An authenticated person who creates albums, uploads media, and manages the platform | Administrator, user, manager |

## Content

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Album** | A named collection of media items representing a single event or theme | Gallery, collection |
| **MediaItem** | A single image or video file that belongs to one album | Image, photo, video, file, media |
| **Cover** | The representative MediaItem displayed as the visual thumbnail for an Album | Thumbnail, preview image |
| **Slug** | The human-readable URL segment derived from an album's name (e.g. `company-christmas-2025`) | URL name, path, alias |

## Access

| Term | Definition | Aliases to avoid |
|---|---|---|
| **ShareableLink** | A public URL in the form `/gallery/:id/:slug` that grants a Viewer access to a specific Album | Share URL, public link, invite link |
| **AdminPanel** | The authenticated section of the app at `/admin/*` where Admins manage content | Admin view, admin dashboard, back-office |
| **GalleryView** | The public section of the app at `/gallery/*` accessible to all Viewers without login | Client view, public view, front-end |

## Storage

| Term | Definition | Aliases to avoid |
|---|---|---|
| **Upload** | The act of adding one or more MediaItems to an Album | Import, ingest |
| **StorageBucket** | The MinIO bucket where MediaItem files are physically stored | File system, storage, bucket |

## Relationships

- An **Album** contains zero or more **MediaItems**
- An **Album** has at most one **Cover**, which is a **MediaItem** within it
- An **Album** has exactly one **Slug**, generated from its name at creation time
- A **ShareableLink** resolves to exactly one **Album**
- An **Admin** can create, edit, and delete **Albums** and **MediaItems**
- A **Viewer** can browse **Albums** and view **MediaItems** via a **ShareableLink** or the **GalleryView**

## Example dialogue

> **Dev:** "When a **Viewer** follows a **ShareableLink**, do they see all **MediaItems** in the **Album**?"

> **Admin:** "Yes — the full **Album** is visible. The **ShareableLink** is just a convenient entry point to a specific **Album** rather than the **GalleryView** home page."

> **Dev:** "If an **Admin** deletes a **MediaItem** that is currently the **Cover**, what happens?"

> **Admin:** "The **Album** should fall back to no cover until the **Admin** sets a new one, or the next **Upload** automatically assigns the first **MediaItem** as the **Cover**."

> **Dev:** "And if an **Admin** renames an **Album**, does the **Slug** change and break existing **ShareableLinks**?"

> **Admin:** "No — the **Slug** is generated once at creation and never updated. The **ShareableLink** resolves by ID first, so renaming the **Album** doesn't break anything."

## Flagged ambiguities

- **"Gallery" vs "Album"** — used interchangeably throughout the conversation. **Album** is the canonical term for the content entity (a named collection of media). **Gallery** is reserved exclusively as a route namespace prefix (`/gallery/*`) referring to the **GalleryView**. Never use "gallery" to mean an **Album**.
- **"Client" vs "Viewer"** — "client" was used to mean the person browsing publicly, but "client" also commonly means the frontend application. **Viewer** is the canonical term for the human browsing publicly. "Client" should only refer to the frontend app (e.g. React client, API client).
- **"Media" vs "Image/Video/File"** — used interchangeably. **MediaItem** is the canonical term for a single piece of content within an **Album**, regardless of whether it is an image or video.
- **"Admin view" vs "Admin panel"** — used interchangeably. **AdminPanel** is the canonical term for the authenticated admin interface.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server on localhost:8080
npm run build      # Production build
npm run build:dev  # Development build (unminified)
npm run lint       # ESLint check
npm run preview    # Preview production build locally
```

No test framework is configured — test coverage is zero.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_USE_LOCAL_DATA=true   # Optional: use in-memory LocalAdapter instead of Supabase
```

## Architecture

Pixera is a Vite + React SPA for event media sharing. Organizations upload, organize, and share event images/videos. Built with React 18, TypeScript, Supabase (auth + DB + storage), React Query v5, React Router v6, shadcn/ui, and Tailwind CSS.

### Entry Points

- `src/main.tsx` → `src/App.tsx`
- `App.tsx` creates the adapter (`createAdapter(backend)`) and wraps the app in `<AdapterProvider>`, `<AuthProvider>`, and `<QueryClientProvider>`

### Routes

| Path | Component | Access |
|---|---|---|
| `/auth` | `Auth.tsx` | Public |
| `/` | `Index.tsx` | Protected |
| `/album/:id` | `Album.tsx` | Protected or public view |
| `/create-album` | `CreateAlbum.tsx` | Admin only |

Route guards: `<ProtectedRoute>` (requires auth or public-view toggle), `<AdminRoute>` (requires auth + admin role).

### Unified Adapter Pattern

All data operations go through a `DataAdapter` interface defined in `src/lib/adapter/types.ts`. Two implementations exist:

- **`LocalAdapter`** (`src/lib/adapter/LocalAdapter.ts`) — uses `src/lib/local-store.ts` (in-memory + localStorage), seeded with `src/lib/mock-data.ts`
- **`SupabaseAdapter`** (`src/lib/adapter/SupabaseAdapter.ts`) — calls Supabase client in `src/integrations/supabase/client.ts`

Access the adapter in components via the `useAdapter()` hook from `src/contexts/AdapterContext.tsx`. Never import adapter implementations directly in components.

### React Query

All server state is managed by React Query. Query keys are centralized in the `queryKeys` factory in `src/lib/adapter/types.ts`. Default config: stale time 5 min, cache time 30 min, 1 retry.

```typescript
const { data } = useQuery({
  queryKey: queryKeys.albums(),
  queryFn: () => adapter.fetchAlbums(),
});
```

Cache invalidation is inconsistent across the codebase — some places use `removeQueries`, others use `invalidateQueries`. Prefer `invalidateQueries` when modifying data.

### Key Directories

```
src/
├── pages/           # Route-level components (5 pages)
├── components/
│   ├── ui/          # shadcn/ui primitives (50+ components, do not edit)
│   ├── album/       # Album-specific feature components
│   └── carousel/    # Image/video carousel with keyboard and download support
├── contexts/        # AuthContext, AdapterContext
├── hooks/           # useImageUpload, useAlbumActions, useAlbumStats, useIsMobile
├── lib/
│   ├── adapter/     # DataAdapter interface + LocalAdapter + SupabaseAdapter
│   ├── types.ts     # Core domain types: Album, MediaItem
│   ├── mappers.ts   # Supabase row → App type conversions
│   ├── storage-helpers.ts  # File validation, media type detection
│   └── local-store.ts      # In-memory store for LocalAdapter
└── integrations/supabase/  # Supabase client singleton + auto-generated DB types
```

### Supabase Schema

Three tables: `albums`, `media`, `profiles`. Storage bucket path structure: `user/{userId}/{albumId}/{fileId}`. Type definitions are auto-generated in `src/integrations/supabase/types.ts` — do not edit manually.

### UI Conventions

- All UI primitives come from `src/components/ui/` (shadcn/ui) — add new shadcn components via `npx shadcn@latest add <component>`
- Styling uses Tailwind CSS with HSL CSS variables defined in `src/index.css`; theme tokens live in `tailwind.config.ts`
- Icons: `lucide-react`
- Toasts/notifications: Sonner via shadcn/ui `<Toaster>`
- Forms: React Hook Form + Zod schemas

### Known Technical Debt (see HANDOFF.md)

- Cache invalidation logic is scattered and inconsistent
- `useImageUpload` hook mixes file validation, upload concurrency, progress tracking, and media construction — should be split
- ZIP download logic is duplicated in three places
- Dialog state is prop-drilled through relay components
- Carousel initial index bug: `useState(() => setCurrentIndex(...))` doesn't work as intended

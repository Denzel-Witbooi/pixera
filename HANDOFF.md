# Pixera — Architecture Handoff

## What Was Done

### Unified Data Adapter (completed)

Eliminated scattered `VITE_USE_LOCAL_DATA` branching. Previously the env flag was read independently in `data-service.ts`, `AuthContext.tsx`, and `useImageUpload.tsx`. Now it is read **once** in `App.tsx` and the decision flows down via dependency injection.

**New files:**
- `src/lib/adapter/types.ts` — `DataAdapter` interface, `queryKeys` factory, `BackendType`
- `src/lib/adapter/local.ts` — `LocalAdapter` (wraps `local-store.ts`)
- `src/lib/adapter/supabase.ts` — `SupabaseAdapter` (wraps Supabase client + mappers)
- `src/lib/adapter/index.ts` — `createAdapter(backend)` factory
- `src/contexts/AdapterContext.tsx` — `AdapterProvider` + `useAdapter()` hook

**Modified files:**
- `src/App.tsx` — single `createAdapter(backend)` call; passes `backend` to `AuthProvider`
- `src/contexts/AuthContext.tsx` — `AuthProvider` now accepts `backend: BackendType` prop
- `src/hooks/useImageUpload.tsx` — `USE_LOCAL` branch removed; calls `adapter.uploadFile()`
- `src/hooks/useAlbumActions.tsx` — imports `useAdapter()` + `queryKeys`
- `src/hooks/useAlbumStats.ts` — imports `useAdapter()` + `queryKeys`
- `src/pages/Album.tsx` — imports `useAdapter()` + `queryKeys`
- `src/pages/Index.tsx` — imports `useAdapter()` + `queryKeys`
- `src/pages/CreateAlbum.tsx` — replaced direct `supabase` calls with `adapter.createAlbum()` / `adapter.updateAlbumCover()`
- `src/components/ViewAlbum.tsx` — imports `useAdapter()` + `queryKeys`

**Deleted:** `src/lib/data-service.ts`

---

## Remaining Architectural Issues (prioritised)

### 1. Query Cache Invalidation Strategy
**Files:** `Album.tsx`, `ViewAlbum.tsx`, `useAlbumActions.tsx`

`queryKeys` is now centralised but invalidation logic is still scattered across 3 files with no consistent rule (some use `removeQueries`, some `invalidateQueries`). Deleting media in `ViewAlbum.tsx` invalidates stats but not `["albums"]`, so album cards can show stale counts.

**Fix:** audit every `queryClient.*` call and apply a consistent rule: `removeQueries` on hard delete, `invalidateQueries` on updates.

---

### 2. Carousel State Initialization Bug
**File:** `src/components/MediaCarousel.tsx` (~line 38)

```tsx
// BUG — this does nothing
useState(() => { setCurrentIndex(initialIndex); });

// CORRECT
const [currentIndex, setCurrentIndex] = useState(initialIndex);
// or if prop can change after mount:
useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);
```

Carousel always opens at index 0 regardless of which item was clicked. Silent — no error thrown.

---

### 3. Upload Hook Still Mixes Concerns
**File:** `src/hooks/useImageUpload.tsx`

`USE_LOCAL` branch is gone but the hook still owns: file validation, progress tracking, concurrency control, media item construction, and `insertMedia`. Hard to test any one concern in isolation.

**Fix:** extract file validation to `src/lib/upload-utils.ts` as pure functions. The hook keeps only state management and orchestration.

---

### 4. Download Logic Duplicated
**Files:** `ViewAlbum.tsx` (ZIP), `carousel/useCarouselDownload.tsx` (single), `MediaItemActions.tsx` (direct link)

Three implementations. `ViewAlbum.tsx` never revokes object URLs. `MediaItemActions.tsx` uses a direct `href` link instead of fetching a blob.

**Fix:** create `src/lib/download-utils.ts` with `downloadFile(url, filename)` and `downloadAlbumAsZip(items, albumTitle)`. Replace all three call sites.

---

### 5. Dialog State Props Drilling
**Files:** `Album.tsx` → `AlbumDialogs.tsx` → child dialogs

`AlbumDialogs` is an empty relay component passing 8 props through. Adding any new dialog requires changes in 3 files. Callback signatures are inconsistent (`onSuccess` vs `onCreateAlbum`, some async some not).

**Fix:** move dialog open/close state to a context (e.g. `AlbumUIContext`) or consolidate into a single `useAlbumDialogs()` hook co-located with `Album.tsx`.

---

### 6. No Tests
Zero test coverage. The adapter pattern makes this tractable now — each `DataAdapter` implementation is a plain class testable without React or Supabase.

**First test targets:**
- `LocalAdapter` unit tests (pure, no mocks needed)
- `SupabaseAdapter` integration tests (mock `supabase` client)
- `useImageUpload` with a `MockAdapter` injected via `AdapterProvider`

import { Album, MediaItem } from "./types";

// Stable picsum.photos seed URLs — no API key needed, always available offline-friendly
const img = (seed: string, w = 800, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MOCK_USER_ID = "local-user-001";

export const SEED_ALBUMS: Album[] = [
  {
    id: "album-001",
    title: "Cape Town Trip",
    description: "Highlights from the team trip to Cape Town.",
    coverUrl: img("cpt-cover"),
    createdAt: "2026-01-15T08:00:00.000Z",
    itemCount: 6,
    slug: "cape-town-trip",
    userId: MOCK_USER_ID,
  },
  {
    id: "album-002",
    title: "Vodacom Brand Shoot",
    description: "Official brand photography for Q1 campaign.",
    coverUrl: img("brand-shoot"),
    createdAt: "2026-02-10T10:30:00.000Z",
    itemCount: 4,
    slug: "vodacom-brand-shoot",
    userId: MOCK_USER_ID,
  },
  {
    id: "album-003",
    title: "Office Events 2026",
    description: "Internal office gatherings and milestone celebrations.",
    coverUrl: img("office-events"),
    createdAt: "2026-03-01T12:00:00.000Z",
    itemCount: 5,
    slug: "office-events-2026",
    userId: MOCK_USER_ID,
  },
];

export const SEED_MEDIA: MediaItem[] = [
  // album-001
  { id: "m-001", albumId: "album-001", url: img("cpt-1"), type: "image", createdAt: "2026-01-15T08:05:00.000Z", title: "Signal Hill sunset" },
  { id: "m-002", albumId: "album-001", url: img("cpt-2"), type: "image", createdAt: "2026-01-15T09:10:00.000Z", title: "V&A Waterfront" },
  { id: "m-003", albumId: "album-001", url: img("cpt-3"), type: "image", createdAt: "2026-01-15T10:00:00.000Z", title: "Table Mountain" },
  { id: "m-004", albumId: "album-001", url: img("cpt-4"), type: "image", createdAt: "2026-01-16T08:30:00.000Z", title: "Camps Bay beach" },
  { id: "m-005", albumId: "album-001", url: img("cpt-5"), type: "image", createdAt: "2026-01-16T11:00:00.000Z", title: "Bo-Kaap colours" },
  { id: "m-006", albumId: "album-001", url: img("cpt-6"), type: "image", createdAt: "2026-01-17T09:45:00.000Z", title: "Kirstenbosch gardens" },

  // album-002
  { id: "m-007", albumId: "album-002", url: img("brand-1"), type: "image", createdAt: "2026-02-10T10:35:00.000Z", title: "Product hero shot" },
  { id: "m-008", albumId: "album-002", url: img("brand-2"), type: "image", createdAt: "2026-02-10T11:00:00.000Z", title: "Lifestyle shot A" },
  { id: "m-009", albumId: "album-002", url: img("brand-3"), type: "image", createdAt: "2026-02-10T11:30:00.000Z", title: "Lifestyle shot B" },
  { id: "m-010", albumId: "album-002", url: img("brand-4"), type: "image", createdAt: "2026-02-10T12:00:00.000Z", title: "Behind the scenes" },

  // album-003
  { id: "m-011", albumId: "album-003", url: img("office-1"), type: "image", createdAt: "2026-03-01T12:05:00.000Z", title: "Town hall Q1" },
  { id: "m-012", albumId: "album-003", url: img("office-2"), type: "image", createdAt: "2026-03-01T12:30:00.000Z", title: "New joiners" },
  { id: "m-013", albumId: "album-003", url: img("office-3"), type: "image", createdAt: "2026-03-05T14:00:00.000Z", title: "Team lunch" },
  { id: "m-014", albumId: "album-003", url: img("office-4"), type: "image", createdAt: "2026-03-10T09:00:00.000Z", title: "Innovation day" },
  { id: "m-015", albumId: "album-003", url: img("office-5"), type: "image", createdAt: "2026-03-20T16:00:00.000Z", title: "Birthday celebration" },
];

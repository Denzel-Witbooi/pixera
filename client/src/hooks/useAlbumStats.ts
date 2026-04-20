
import { useQuery } from "@tanstack/react-query";
import { Album } from "@/lib/types";
import { useAdapter } from "@/contexts/AdapterContext";
import { queryKeys } from "@/lib/adapter";

export const useAlbumStats = (albums: Album[]) => {
  const adapter = useAdapter();
  const albumIds = albums.map((album) => album.id);

  const { data: albumsWithStats = albums, isLoading } = useQuery<Album[]>({
    queryKey: queryKeys.mediaCounts(albumIds),
    enabled: albumIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const countMap = await adapter.fetchMediaCountsForAlbums(albumIds);
      return albums.map((album) => ({
        ...album,
        itemCount: countMap[album.id] || 0,
      }));
    },
  });

  return { albumsWithStats, isLoading };
};


import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Album } from '@/lib/types';

export const useAlbumStats = (albums: Album[]) => {
  const [albumsWithStats, setAlbumsWithStats] = useState<Album[]>(albums);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAlbumStats = async () => {
      if (!albums.length) return;
      
      setIsLoading(true);
      
      try {
        // Get counts of media items for each album
        const albumIds = albums.map(album => album.id);
        const { data, error } = await supabase
          .from('media_items')
          .select('album_id, id')
          .in('album_id', albumIds);
          
        if (error) {
          throw error;
        }
        
        // Create a map of album_id to count
        const countMap: Record<string, number> = {};
        data.forEach(item => {
          countMap[item.album_id] = (countMap[item.album_id] || 0) + 1;
        });
        
        // Update the albums with their counts
        const updatedAlbums = albums.map(album => ({
          ...album,
          itemCount: countMap[album.id] || 0
        }));
        
        setAlbumsWithStats(updatedAlbums);
      } catch (error) {
        console.error('Error fetching album stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlbumStats();
  }, [albums]);
  
  return { albumsWithStats, isLoading };
};

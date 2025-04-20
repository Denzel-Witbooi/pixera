
-- Seed data for albums
INSERT INTO public.albums (id, title, description, user_id, cover_url, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Summer Vacation 2024', 'Memorable moments from our summer trip', '00000000-0000-0000-0000-000000000000', 'https://source.unsplash.com/random/800x600?summer', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Office Party 2024', 'Annual company celebration', '00000000-0000-0000-0000-000000000000', 'https://source.unsplash.com/random/800x600?party', NOW());

-- Seed data for media items
INSERT INTO public.media_items (id, album_id, url, type, title, description, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'https://source.unsplash.com/random/800x600?beach', 'image', 'Beach Day', 'Beautiful day at the beach', NOW()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'https://source.unsplash.com/random/800x600?sunset', 'image', 'Sunset View', 'Amazing sunset from our hotel', NOW()),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', 'https://source.unsplash.com/random/800x600?celebration', 'image', 'Team Photo', 'Group photo from the party', NOW()),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', 'https://source.unsplash.com/random/800x600?party', 'image', 'Dance Floor', 'Everyone enjoying the music', NOW());


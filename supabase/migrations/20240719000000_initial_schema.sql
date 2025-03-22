
-- Create the profiles table to store user profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to read all profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

-- Create a policy to allow users to update their own profiles
CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create the albums table to store photo albums
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on albums
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view all albums
CREATE POLICY "Anyone can view albums" ON public.albums
  FOR SELECT USING (true);

-- Create a policy to allow users to insert their own albums
CREATE POLICY "Users can insert their own albums" ON public.albums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a policy to allow users to update their own albums
CREATE POLICY "Users can update their own albums" ON public.albums
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a policy to allow users to delete their own albums
CREATE POLICY "Users can delete their own albums" ON public.albums
  FOR DELETE USING (auth.uid() = user_id);

-- Create the media_items table to store images and videos
CREATE TABLE IF NOT EXISTS public.media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on media_items
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view all media items
CREATE POLICY "Anyone can view media items" ON public.media_items
  FOR SELECT USING (true);

-- Create a policy to allow users to insert media items into their own albums
CREATE POLICY "Users can insert media items into their own albums" ON public.media_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_id AND albums.user_id = auth.uid()
    )
  );

-- Create a policy to allow users to update media items in their own albums
CREATE POLICY "Users can update media items in their own albums" ON public.media_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_id AND albums.user_id = auth.uid()
    )
  );

-- Create a policy to allow users to delete media items in their own albums
CREATE POLICY "Users can delete media items in their own albums" ON public.media_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_id AND albums.user_id = auth.uid()
    )
  );

-- Create a function to automatically create a profile after sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that calls the function after a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('album_media', 'album_media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable storage policies for authenticated users
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'album_media' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Anyone can view media" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'album_media'
  );

CREATE POLICY "Users can update their own media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'album_media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'album_media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

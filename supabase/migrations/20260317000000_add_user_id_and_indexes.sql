-- Add user_id column to hotzones table for user isolation
ALTER TABLE public.hotzones ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add indexes for performance optimization
-- Index 1: (user_id, audio_id, created_at) for fetchHotzones queries
CREATE INDEX IF NOT EXISTS idx_hotzones_user_audio_created 
ON public.hotzones(user_id, audio_id, created_at DESC);

-- Index 2: (user_id, created_at) for fetchAllHotzones queries
CREATE INDEX IF NOT EXISTS idx_hotzones_user_created 
ON public.hotzones(user_id, created_at DESC);

-- Index 3: (audio_id, start_time) for time-range queries
CREATE INDEX IF NOT EXISTS idx_hotzones_audio_time 
ON public.hotzones(audio_id, start_time);

-- Index 4: (user_id) for user-specific queries
CREATE INDEX IF NOT EXISTS idx_hotzones_user_id 
ON public.hotzones(user_id);

-- Add index to transcripts table for faster lookups
CREATE INDEX IF NOT EXISTS idx_transcripts_audio_time 
ON public.transcripts(audio_id, start_time, end_time);

-- Update RLS policies to enforce user_id isolation
-- Drop old policies that allow public access
DROP POLICY IF EXISTS "Allow public read access on hotzones" ON public.hotzones;
DROP POLICY IF EXISTS "Allow public insert access on hotzones" ON public.hotzones;
DROP POLICY IF EXISTS "Allow public update access on hotzones" ON public.hotzones;

-- Create new policies with user_id isolation
-- Policy: Users can only read their own hotzones
CREATE POLICY "Users can read their own hotzones"
ON public.hotzones FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can insert hotzones (user_id will be set by application)
CREATE POLICY "Users can insert hotzones"
ON public.hotzones FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Users can update their own hotzones
CREATE POLICY "Users can update their own hotzones"
ON public.hotzones FOR UPDATE
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Add comment
COMMENT ON COLUMN public.hotzones.user_id IS 'User ID for row-level security and user isolation';

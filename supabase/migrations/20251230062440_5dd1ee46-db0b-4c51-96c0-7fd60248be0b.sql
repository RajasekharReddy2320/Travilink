-- Add public_key column to profiles for E2E encryption
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_key TEXT;

-- Add encryption columns to messages table for E2E encrypted messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
ADD COLUMN IF NOT EXISTS iv TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_key ON public.profiles(public_key) WHERE public_key IS NOT NULL;
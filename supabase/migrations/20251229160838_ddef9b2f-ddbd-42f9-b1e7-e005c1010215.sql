-- Create a table for sensitive user data with strict RLS
CREATE TABLE public.sensitive_user_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sensitive_user_data ENABLE ROW LEVEL SECURITY;

-- STRICT RLS: Only the owner can view their own data
CREATE POLICY "Users can view their own sensitive data"
ON public.sensitive_user_data
FOR SELECT
USING (auth.uid() = user_id);

-- Only the owner can insert their own data
CREATE POLICY "Users can insert their own sensitive data"
ON public.sensitive_user_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only the owner can update their own data
CREATE POLICY "Users can update their own sensitive data"
ON public.sensitive_user_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Only the owner can delete their own data
CREATE POLICY "Users can delete their own sensitive data"
ON public.sensitive_user_data
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sensitive_user_data_updated_at
BEFORE UPDATE ON public.sensitive_user_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create the feedback table
CREATE TABLE public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Allow anonymous inserts" ON public.feedback FOR INSERT TO anon WITH CHECK (true);

-- Allow reads only for authenticated service roles (Admin Dashboard)
CREATE POLICY "Allow service role reads" ON public.feedback FOR SELECT TO service_role USING (true);
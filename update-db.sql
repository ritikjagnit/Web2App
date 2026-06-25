-- SQL script to add API Key support and Newsletter subscriptions table

-- 1. Add api_key column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_key TEXT;

-- 2. Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS for newsletter_subscriptions
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow public (anyone) to insert new subscriptions
DROP POLICY IF EXISTS "Allow public inserts" ON public.newsletter_subscriptions;
CREATE POLICY "Allow public inserts" ON public.newsletter_subscriptions 
    FOR INSERT 
    WITH CHECK (true);

-- 5. Policy: Allow admins to select/read subscriptions
DROP POLICY IF EXISTS "Allow admins to read subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Allow admins to read subscriptions" ON public.newsletter_subscriptions 
    FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_roles WHERE role = 'admin'
        )
    );

-- 6. Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'developer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(owner_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow owners to manage team" ON public.team_members;
CREATE POLICY "Allow owners to manage team" ON public.team_members
    FOR ALL
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 7. Create play_store_submissions table
CREATE TABLE IF NOT EXISTS public.play_store_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.play_store_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to manage own submissions" ON public.play_store_submissions;
CREATE POLICY "Allow users to manage own submissions" ON public.play_store_submissions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to manage own tickets" ON public.support_tickets;
CREATE POLICY "Allow users to manage own tickets" ON public.support_tickets
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

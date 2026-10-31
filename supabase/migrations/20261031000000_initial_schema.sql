-- ==============================================================================
-- TANYARA DATABASE SCHEMA & MULTI-TENANT RLS POLICIES
-- Multi-tenant AI Chatbot Platform for Indonesian Businesses and Organizations
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ORGANIZATIONS (Tenant Root Entity)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- 3. ORGANIZATION MEMBERS (Role-Based Access)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- 4. SECURITY HELPER FUNCTIONS (DEFINED AFTER TABLES TO PREVENT RELATION ERRORS)
-- Non-recursive helper: returns all organization IDs for the authenticated caller
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$;

-- Checks if caller is a member of the organization
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = check_org_id
      AND user_id = auth.uid()
  );
$$;

-- Checks if caller is an owner or admin of the organization
CREATE OR REPLACE FUNCTION public.is_org_owner_or_admin(check_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = check_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_organization_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_organization_ids() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_org_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_org_owner_or_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_owner_or_admin(UUID) TO authenticated, service_role;

-- 5. CHATBOTS
CREATE TABLE IF NOT EXISTS public.chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    welcome_message TEXT NOT NULL DEFAULT 'Halo! Ada yang bisa saya bantu hari ini?',
    system_prompt TEXT NOT NULL DEFAULT 'Anda adalah asisten AI yang ramah, profesional, dan membantu pelanggan dengan informasi akurat berdasarkan dokumen bisnis yang disediakan.',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chatbots_slug ON public.chatbots(slug);
CREATE INDEX IF NOT EXISTS idx_chatbots_org ON public.chatbots(organization_id);

-- 6. DOCUMENTS (Knowledge Base File Registry)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    error_message TEXT,
    chunk_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_chatbot ON public.documents(chatbot_id);

-- 7. DOCUMENT CHUNKS (RAG Vector Store for text-embedding-004 - 768 Dimensions)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768),
    chunk_index INT NOT NULL,
    token_count INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_chatbot ON public.document_chunks(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- 8. CONVERSATIONS (Public Visitors & Chat Sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
    visitor_session_id TEXT,
    visitor_name TEXT,
    visitor_email TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_conversations_chatbot ON public.conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON public.conversations(visitor_session_id);

-- 9. MESSAGES (Visitor & AI Assistant Messages)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- 10. USAGE LOGS (Audit & Token Cost Tracking)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    cost_cents INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_org ON public.usage_logs(organization_id);

-- 11. VECTOR SIMILARITY SEARCH RPC
CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(768),
    filter_chatbot_id UUID,
    match_threshold float DEFAULT 0.4,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    similarity float,
    metadata JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.metadata
  FROM public.document_chunks dc
  JOIN public.chatbots cb ON cb.id = dc.chatbot_id
  WHERE dc.chatbot_id = filter_chatbot_id
    AND cb.is_active = true
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_document_chunks TO anon, authenticated, service_role;

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation and deliberate public access boundaries
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 12.1 ORGANIZATIONS POLICIES
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to"
    ON public.organizations FOR SELECT
    USING (id IN (SELECT public.get_user_organization_ids()));

DROP POLICY IF EXISTS "Authenticated users can create an organization" ON public.organizations;
CREATE POLICY "Authenticated users can create an organization"
    ON public.organizations FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners and Admins can update their organization" ON public.organizations;
CREATE POLICY "Owners and Admins can update their organization"
    ON public.organizations FOR UPDATE
    USING (public.is_org_owner_or_admin(id))
    WITH CHECK (public.is_org_owner_or_admin(id));

DROP POLICY IF EXISTS "Owners can delete their organization" ON public.organizations;
CREATE POLICY "Owners can delete their organization"
    ON public.organizations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = public.organizations.id
              AND om.user_id = auth.uid()
              AND om.role = 'owner'
        )
    );

-- 12.2 ORGANIZATION MEMBERS POLICIES (Guarded against recursion)
DROP POLICY IF EXISTS "Users can view their own membership" ON public.organization_members;
CREATE POLICY "Users can view their own membership"
    ON public.organization_members FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view fellow members in same org" ON public.organization_members;
CREATE POLICY "Members can view fellow members in same org"
    ON public.organization_members FOR SELECT
    USING (organization_id IN (SELECT public.get_user_organization_ids()));

DROP POLICY IF EXISTS "Authorized member insertion" ON public.organization_members;
CREATE POLICY "Authorized member insertion"
    ON public.organization_members FOR INSERT TO authenticated
    WITH CHECK (
        -- (a) Creator bootstrap: first owner of a newly created org
        (user_id = auth.uid() AND NOT EXISTS (
            SELECT 1 FROM public.organization_members existing
            WHERE existing.organization_id = organization_members.organization_id
        ))
        -- (b) Org owner/admin inviting a new member
        OR public.is_org_owner_or_admin(organization_id)
    );

DROP POLICY IF EXISTS "Owners can update member roles" ON public.organization_members;
CREATE POLICY "Owners can update member roles"
    ON public.organization_members FOR UPDATE
    USING (public.is_org_owner_or_admin(organization_id))
    WITH CHECK (public.is_org_owner_or_admin(organization_id));

DROP POLICY IF EXISTS "Owners can remove members or user can leave" ON public.organization_members;
CREATE POLICY "Owners can remove members or user can leave"
    ON public.organization_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.is_org_owner_or_admin(organization_id)
    );

-- 12.3 CHATBOTS POLICIES
DROP POLICY IF EXISTS "Public can view active chatbots by slug" ON public.chatbots;
CREATE POLICY "Public can view active chatbots by slug"
    ON public.chatbots FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Organization members can manage chatbots" ON public.chatbots;
CREATE POLICY "Organization members can manage chatbots"
    ON public.chatbots FOR ALL
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

-- 12.4 DOCUMENTS POLICIES (Strictly NO public access)
DROP POLICY IF EXISTS "Organization members can manage chatbot documents" ON public.documents;
CREATE POLICY "Organization members can manage chatbot documents"
    ON public.documents FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = public.documents.chatbot_id
              AND public.is_org_member(cb.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = public.documents.chatbot_id
              AND public.is_org_member(cb.organization_id)
        )
    );

-- 12.5 DOCUMENT CHUNKS POLICIES (Strictly NO public access)
DROP POLICY IF EXISTS "Organization members can manage document chunks" ON public.document_chunks;
CREATE POLICY "Organization members can manage document chunks"
    ON public.document_chunks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = public.document_chunks.chatbot_id
              AND public.is_org_member(cb.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = public.document_chunks.chatbot_id
              AND public.is_org_member(cb.organization_id)
        )
    );

-- 12.6 CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Public can insert conversations on active chatbots" ON public.conversations;
CREATE POLICY "Public can insert conversations on active chatbots"
    ON public.conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = chatbot_id
              AND cb.is_active = true
        )
    );

DROP POLICY IF EXISTS "Organization members can view conversations" ON public.conversations;
CREATE POLICY "Organization members can view conversations"
    ON public.conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chatbots cb
            WHERE cb.id = public.conversations.chatbot_id
              AND public.is_org_member(cb.organization_id)
        )
    );

-- 12.7 MESSAGES POLICIES
DROP POLICY IF EXISTS "Public can insert messages into conversations" ON public.messages;
CREATE POLICY "Public can insert messages into conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations conv
            JOIN public.chatbots cb ON conv.chatbot_id = cb.id
            WHERE conv.id = conversation_id
              AND cb.is_active = true
        )
    );

DROP POLICY IF EXISTS "Organization members can view messages" ON public.messages;
CREATE POLICY "Organization members can view messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations conv
            JOIN public.chatbots cb ON conv.chatbot_id = cb.id
            WHERE conv.id = public.messages.conversation_id
              AND public.is_org_member(cb.organization_id)
        )
    );

-- 12.8 USAGE LOGS POLICIES
DROP POLICY IF EXISTS "Organization members can view usage logs" ON public.usage_logs;
CREATE POLICY "Organization members can view usage logs"
    ON public.usage_logs FOR SELECT
    USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Organization members can record usage logs" ON public.usage_logs;
CREATE POLICY "Organization members can record usage logs"
    ON public.usage_logs FOR INSERT
    WITH CHECK (public.is_org_member(organization_id));

-- ==============================================================================
-- 13. SUPABASE STORAGE BUCKET & POLICIES (Private 'documents' bucket)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'documents',
            'documents',
            false, -- STRICTLY PRIVATE
            10485760, -- 10MB limit
            ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 10485760,
            allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    END IF;
END $$;

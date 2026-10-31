import os
import re
from pathlib import Path


def test_migration_order_and_dependencies():
    migration_path = Path("supabase/migrations/20261031000000_initial_schema.sql")
    assert migration_path.exists(), "Migration file 20261031000000_initial_schema.sql must exist"

    sql = migration_path.read_text(encoding="utf-8")

    # 1. Extensions check
    pos_uuid = sql.find('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    pos_vector = sql.find('CREATE EXTENSION IF NOT EXISTS "vector"')
    assert pos_uuid != -1, "uuid-ossp extension must be created"
    assert pos_vector != -1, "vector extension must be created"

    # 2. Table creation positions
    pos_orgs = sql.find("CREATE TABLE IF NOT EXISTS public.organizations")
    pos_members = sql.find("CREATE TABLE IF NOT EXISTS public.organization_members")
    pos_is_org_member = sql.find("CREATE OR REPLACE FUNCTION public.is_org_member")
    pos_chatbots = sql.find("CREATE TABLE IF NOT EXISTS public.chatbots")
    pos_docs = sql.find("CREATE TABLE IF NOT EXISTS public.documents")
    pos_chunks = sql.find("CREATE TABLE IF NOT EXISTS public.document_chunks")
    pos_rpc = sql.find("CREATE OR REPLACE FUNCTION public.match_document_chunks")

    # Assert dependency sequence
    assert pos_orgs != -1, "organizations table must exist"
    assert pos_members != -1, "organization_members table must exist"
    assert pos_is_org_member != -1, "is_org_member function must exist"

    # Organizations must be before organization_members
    assert pos_orgs < pos_members, "organizations must be defined before organization_members"

    # CRITICAL BUG FIX VALIDATION:
    # organization_members MUST be defined before is_org_member function
    assert pos_members < pos_is_org_member, (
        "CRITICAL: organization_members table MUST be created BEFORE is_org_member function "
        "to prevent ERROR: relation 'public.organization_members' does not exist."
    )

    # Chatbots must be before documents and chunks
    assert pos_chatbots < pos_docs, "chatbots must be defined before documents"
    assert pos_docs < pos_chunks, "documents must be defined before document_chunks"

    # 3. Vector dimension check: text-embedding-004 uses 768 dimensions
    assert "vector(768)" in sql, "document_chunks table must use vector(768)"
    assert "query_embedding vector(768)" in sql, "match_document_chunks RPC must use vector(768)"

    # 4. Storage private bucket check
    assert "documents" in sql
    assert "storage.buckets" in sql

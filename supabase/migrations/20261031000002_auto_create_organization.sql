-- ==============================================================================
-- TANYARA MIGRATION: AUTO-PROVISION ORGANIZATION ON USER REGISTRATION
-- Automatically provisions an organization and owner membership record
-- whenever a new user is created in auth.users.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  biz_name text;
  base_slug text;
BEGIN
  -- Extract business name from metadata or derive from email
  biz_name := coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email, '@', 1) || ' Bisnis');
  IF biz_name IS NULL OR trim(biz_name) = '' THEN
    biz_name := 'Bisnis Saya';
  END IF;

  -- Generate clean URL-friendly slug
  base_slug := lower(regexp_replace(biz_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug) || '-' || substr(md5(random()::text), 1, 6);

  -- 1. Create Organization
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (biz_name, base_slug, 'free')
  RETURNING id INTO new_org_id;

  -- 2. Assign User as Owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

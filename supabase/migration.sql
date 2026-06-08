-- EduPress Supabase Security Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: ajhrqbtlllmmdveorbcw
--
-- What this does:
-- 1. Creates all 6 tables with proper structure
-- 2. Enables Row Level Security on every table
-- 3. Locks down write operations to admin users only
-- 4. Gives public read access to published content
-- 5. Adds thumbnail column to series table
-- 6. Revokes anon SQL access (closes privilege escalation)

-- ============================================================
-- STEP 1: Create tables if they don't exist
-- ============================================================

CREATE TABLE IF NOT EXISTS series (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  badge      TEXT,
  thumbnail  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id           TEXT PRIMARY KEY,
  series_id    TEXT REFERENCES series(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  duration     TEXT,
  thumbnail    TEXT,
  video_url    TEXT,
  order_index  INTEGER NOT NULL DEFAULT 0,
  published    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instructors (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  bio         TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banners (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  image_url   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For tracking deleted auth users (used by admin user management)
CREATE TABLE IF NOT EXISTS deleted_users (
  user_id    UUID PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add thumbnail to series if upgrading from an older schema
ALTER TABLE series ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- ============================================================
-- STEP 2: Enable Row Level Security on all tables
-- ============================================================

ALTER TABLE series       ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Drop any existing policies (clean slate)
-- ============================================================

DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename IN ('series','classes','instructors','notifications','banners','deleted_users')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- STEP 4: Create secure RLS policies
-- Admin = authenticated user with app_metadata.role = 'admin'
-- ============================================================

-- Helper: is the current user an admin?
-- (Set app_metadata.role = 'admin' via Supabase Auth → Users → Edit User)

-- SERIES: public read, admin write
CREATE POLICY "series_public_read"  ON series FOR SELECT USING (true);
CREATE POLICY "series_admin_insert" ON series FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "series_admin_update" ON series FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "series_admin_delete" ON series FOR DELETE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- CLASSES: public read of published only, admin full access
CREATE POLICY "classes_public_read" ON classes FOR SELECT USING (
  published = true
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "classes_admin_insert" ON classes FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "classes_admin_update" ON classes FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "classes_admin_delete" ON classes FOR DELETE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- INSTRUCTORS: public read, admin write
CREATE POLICY "instructors_public_read"  ON instructors FOR SELECT USING (true);
CREATE POLICY "instructors_admin_insert" ON instructors FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "instructors_admin_update" ON instructors FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "instructors_admin_delete" ON instructors FOR DELETE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- NOTIFICATIONS: admin only (no public read — push notifications are internal)
CREATE POLICY "notifications_admin_all" ON notifications FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
) WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- BANNERS: public read of active banners, admin write
CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (active = true OR
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "banners_admin_insert" ON banners FOR INSERT WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "banners_admin_update" ON banners FOR UPDATE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
CREATE POLICY "banners_admin_delete" ON banners FOR DELETE USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- DELETED_USERS: admin only
CREATE POLICY "deleted_users_admin_all" ON deleted_users FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
) WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- ============================================================
-- STEP 5: Revoke anon direct SQL access (close escalation path)
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant back only what PostgREST needs for anon API reads
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON series, classes, instructors, banners TO anon;

-- Grant authenticated users access (RLS policies control what they can do)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================
-- STEP 6: Mark your admin user
-- Run this AFTER the above. Replace the UUID with your user's ID.
-- Find it in: Supabase Dashboard → Authentication → Users
-- ============================================================

-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
-- WHERE id = 'YOUR-USER-UUID-HERE';

-- ============================================================
-- Verification: confirm policies were created
-- ============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('series','classes','instructors','notifications','banners','deleted_users')
ORDER BY tablename, cmd;

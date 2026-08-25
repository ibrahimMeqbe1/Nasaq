-- ========================================================
-- سكربت إنشاء وتحديث جداول مشروع إدارة المخيمات على Supabase
-- قم بنسخ هذا السكربت وتشغيله في Supabase -> SQL Editor -> Run
-- ========================================================

-- 1. جدول العائلات (families)
CREATE TABLE IF NOT EXISTS public.families (
    id TEXT PRIMARY KEY,
    camp_id TEXT NOT NULL DEFAULT 'kareem',
    name TEXT NOT NULL,
    id_number TEXT,
    phone TEXT,
    members_count INTEGER DEFAULT 1,
    location TEXT,
    status TEXT,
    dob TEXT,
    wife_name TEXT,
    wife_id TEXT,
    wife_dob TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة العائلات في حال وجود الجدول سابقاً
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS camp_id TEXT DEFAULT 'kareem';
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS wife_name TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS wife_id TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS wife_dob TEXT;
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. جدول الترشيحات (nominations)
CREATE TABLE IF NOT EXISTS public.nominations (
    id TEXT PRIMARY KEY,
    camp_id TEXT NOT NULL DEFAULT 'kareem',
    name TEXT NOT NULL,
    id_number TEXT,
    phone TEXT,
    members_count INTEGER DEFAULT 1,
    location TEXT,
    status TEXT,
    has_disabled INTEGER DEFAULT 0,
    has_chronic_disease INTEGER DEFAULT 0,
    is_lactating_or_pregnant INTEGER DEFAULT 0,
    is_female_headed INTEGER DEFAULT 0,
    dob TEXT,
    wife_name TEXT,
    wife_id TEXT,
    wife_dob TEXT,
    notes TEXT,
    serial_no INTEGER DEFAULT 0,
    gender TEXT DEFAULT 'ذكر',
    phone_alt TEXT,
    wife_2_name TEXT,
    wife_2_id TEXT,
    age_0_2_male INTEGER DEFAULT 0,
    age_0_2_female INTEGER DEFAULT 0,
    age_3_5_male INTEGER DEFAULT 0,
    age_3_5_female INTEGER DEFAULT 0,
    age_6_18_male INTEGER DEFAULT 0,
    age_6_18_female INTEGER DEFAULT 0,
    age_19_60_male INTEGER DEFAULT 0,
    age_19_60_female INTEGER DEFAULT 0,
    age_over_60_male INTEGER DEFAULT 0,
    age_over_60_female INTEGER DEFAULT 0,
    current_address TEXT,
    original_address TEXT,
    governorate TEXT DEFAULT 'شمال غزة',
    camp_name TEXT,
    shelter_manager TEXT,
    shelter_phone TEXT,
    shelter_phone_alt TEXT,
    shelter_address TEXT,
    shelter_gps TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة الترشيحات في حال وجود الجدول سابقاً
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS camp_id TEXT DEFAULT 'kareem';
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS has_disabled INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS has_chronic_disease INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS is_lactating_or_pregnant INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS is_female_headed INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS wife_name TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS wife_id TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS wife_dob TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS serial_no INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'ذكر';
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS phone_alt TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS wife_2_name TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS wife_2_id TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_0_2_male INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_0_2_female INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_3_5_male INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_3_5_female INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_6_18_male INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_6_18_female INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_19_60_male INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_19_60_female INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_over_60_male INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS age_over_60_female INTEGER DEFAULT 0;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS current_address TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS original_address TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS governorate TEXT DEFAULT 'شمال غزة';
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS camp_name TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS shelter_manager TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS shelter_phone TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS shelter_phone_alt TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS shelter_address TEXT;
ALTER TABLE public.nominations ADD COLUMN IF NOT EXISTS shelter_gps TEXT;

-- 3. جدول المخيمات (camps)
CREATE TABLE IF NOT EXISTS public.camps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    manager_name TEXT,
    manager_phone TEXT,
    phone TEXT,
    address TEXT,
    families_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_expiry TIMESTAMPTZ,
    notes TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة المخيمات في حال وجود الجدول سابقاً
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS manager_phone TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS families_count INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 4. جدول المستخدمين والمصادقة (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    camp_id TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة المستخدمين
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS camp_id TEXT DEFAULT 'kareem';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.users DROP COLUMN IF EXISTS password;
ALTER TABLE public.users ALTER COLUMN camp_id DROP NOT NULL;
UPDATE public.users SET camp_id = NULL WHERE role = 'superadmin';

-- 5. جدول طلبات تجديد الاشتراكات (renewal_requests)
CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id TEXT PRIMARY KEY,
    camp_id TEXT NOT NULL,
    camp_name TEXT NOT NULL,
    requested_months INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    request_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- 6. جدول الإعلانات والتنبيهات (announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- لا يضيف مخيمات أو حسابات تجريبية. تُنشأ الحسابات حصراً عبر Supabase Auth
-- ومسار المشرف المحمي في التطبيق.

-- ========================================================
-- سياسات الأمان والحماية المتقدمة (Row Level Security - RLS)
-- ========================================================

-- 1. دوال داخل مخطط غير مكشوف للـ Data API
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.get_current_user_camp_id()
RETURNS TEXT AS $$
  SELECT camp_id FROM public.users WHERE id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION private.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text AND role = 'superadmin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION private.get_current_user_camp_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_current_user_camp_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO authenticated;

DO $$
BEGIN
    -- إلغاء السياسات القديمة إن وجدت لإمكانية إعادة تشغيل السكربت بدون أخطاء
    DROP POLICY IF EXISTS "allow_all_families" ON public.families;
    DROP POLICY IF EXISTS "allow_all_nominations" ON public.nominations;
    DROP POLICY IF EXISTS "allow_all_camps" ON public.camps;
    DROP POLICY IF EXISTS "allow_all_users" ON public.users;
    DROP POLICY IF EXISTS "allow_all_renewal_requests" ON public.renewal_requests;
    DROP POLICY IF EXISTS "allow_all_announcements" ON public.announcements;

    DROP POLICY IF EXISTS "families_camp_isolation" ON public.families;
    DROP POLICY IF EXISTS "nominations_camp_isolation" ON public.nominations;
    DROP POLICY IF EXISTS "camps_access_policy" ON public.camps;
    DROP POLICY IF EXISTS "users_self_or_superadmin" ON public.users;
    DROP POLICY IF EXISTS "renewal_requests_isolation" ON public.renewal_requests;
    DROP POLICY IF EXISTS "announcements_read_authenticated" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_write_superadmin" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_insert_superadmin" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_update_superadmin" ON public.announcements;
    DROP POLICY IF EXISTS "announcements_delete_superadmin" ON public.announcements;
    DROP POLICY IF EXISTS "system_settings_read_authenticated" ON public.system_settings;
    DROP POLICY IF EXISTS "system_settings_write_superadmin" ON public.system_settings;
    DROP POLICY IF EXISTS "system_settings_insert_superadmin" ON public.system_settings;
    DROP POLICY IF EXISTS "system_settings_update_superadmin" ON public.system_settings;
    DROP POLICY IF EXISTS "system_settings_delete_superadmin" ON public.system_settings;

    -- 1. جدول العائلات (تطبيق عزل البيانات بين المخيمات)
    ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "families_camp_isolation" ON public.families FOR ALL TO authenticated
    USING (private.is_superadmin() OR camp_id = private.get_current_user_camp_id())
    WITH CHECK (private.is_superadmin() OR camp_id = private.get_current_user_camp_id());

    -- 2. جدول الترشيحات (تطبيق عزل البيانات بين المخيمات)
    ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "nominations_camp_isolation" ON public.nominations FOR ALL TO authenticated
    USING (private.is_superadmin() OR camp_id = private.get_current_user_camp_id())
    WITH CHECK (private.is_superadmin() OR camp_id = private.get_current_user_camp_id());

    -- 3. جدول المخيمات
    ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "camps_access_policy" ON public.camps FOR ALL TO authenticated
    USING (private.is_superadmin() OR id = private.get_current_user_camp_id())
    WITH CHECK (private.is_superadmin() OR id = private.get_current_user_camp_id());

    -- 4. جدول المستخدمين (حظر الاستعلام المباشر لغير المالك أو المشرف العام مع السماح بالتحقق عند تسجيل الدخول)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "users_self_or_superadmin" ON public.users FOR ALL TO authenticated
    USING (private.is_superadmin() OR id = (SELECT auth.uid())::text)
    WITH CHECK (private.is_superadmin() OR id = (SELECT auth.uid())::text);

    DROP POLICY IF EXISTS "users_login_lookup" ON public.users;

    -- 5. جدول طلبات التجديد
    ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "renewal_requests_isolation" ON public.renewal_requests FOR ALL TO authenticated
    USING (private.is_superadmin() OR camp_id = private.get_current_user_camp_id())
    WITH CHECK (private.is_superadmin() OR camp_id = private.get_current_user_camp_id());

    -- 6. جدول الإعلانات (متاح للقراءة لجميع المستخدمين الموثقين، وللتعديل للمشرف العام فقط)
    ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "announcements_read_authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
    CREATE POLICY "announcements_insert_superadmin" ON public.announcements FOR INSERT TO authenticated
    WITH CHECK (private.is_superadmin());
    CREATE POLICY "announcements_update_superadmin" ON public.announcements FOR UPDATE TO authenticated
    USING (private.is_superadmin()) WITH CHECK (private.is_superadmin());
    CREATE POLICY "announcements_delete_superadmin" ON public.announcements FOR DELETE TO authenticated
    USING (private.is_superadmin());

    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "system_settings_read_authenticated" ON public.system_settings FOR SELECT TO authenticated USING (true);
    CREATE POLICY "system_settings_insert_superadmin" ON public.system_settings FOR INSERT TO authenticated
    WITH CHECK (private.is_superadmin());
    CREATE POLICY "system_settings_update_superadmin" ON public.system_settings FOR UPDATE TO authenticated
    USING (private.is_superadmin()) WITH CHECK (private.is_superadmin());
    CREATE POLICY "system_settings_delete_superadmin" ON public.system_settings FOR DELETE TO authenticated
    USING (private.is_superadmin());
END $$;

DROP FUNCTION IF EXISTS public.get_current_user_camp_id();
DROP FUNCTION IF EXISTS public.is_superadmin();

-- إزالة مسار تسجيل الدخول القديم الذي كان يعيد صف المستخدم (بما فيه حقل كلمة المرور).
DROP FUNCTION IF EXISTS public.get_user_for_login(TEXT);

-- Explicit Data API grants (required for newer Supabase projects). RLS still
-- determines which rows each authenticated user may access.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nominations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camps TO authenticated;
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.renewal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;

-- علاقات الحذف المتسلسل، القيود والفهارس التشغيلية
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'families_camp_id_fkey') THEN
        ALTER TABLE public.families ADD CONSTRAINT families_camp_id_fkey
        FOREIGN KEY (camp_id) REFERENCES public.camps(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nominations_camp_id_fkey') THEN
        ALTER TABLE public.nominations ADD CONSTRAINT nominations_camp_id_fkey
        FOREIGN KEY (camp_id) REFERENCES public.camps(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'renewal_requests_camp_id_fkey') THEN
        ALTER TABLE public.renewal_requests ADD CONSTRAINT renewal_requests_camp_id_fkey
        FOREIGN KEY (camp_id) REFERENCES public.camps(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_camp_id_fkey') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_camp_id_fkey
        FOREIGN KEY (camp_id) REFERENCES public.camps(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'superadmin'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS families_camp_created_idx ON public.families(camp_id, created_at);
CREATE INDEX IF NOT EXISTS nominations_camp_created_idx ON public.nominations(camp_id, created_at);
CREATE INDEX IF NOT EXISTS renewal_requests_camp_status_idx ON public.renewal_requests(camp_id, status);
CREATE INDEX IF NOT EXISTS users_camp_role_idx ON public.users(camp_id, role);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON public.users(lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS families_camp_id_number_key
ON public.families(camp_id, id_number) WHERE nullif(trim(id_number), '') IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS nominations_camp_id_number_key
ON public.nominations(camp_id, id_number) WHERE nullif(trim(id_number), '') IS NOT NULL;

-- عمليات المشرف الحساسة: معاملة واحدة لبيانات المخيم، وصلاحيات تنفيذ محدودة.
CREATE OR REPLACE FUNCTION public.create_camp_profile(
    target_camp_id TEXT, target_name TEXT, target_manager_name TEXT,
    target_phone TEXT, target_expiry TIMESTAMPTZ, target_user_id TEXT,
    target_username TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'service role required' USING errcode = '42501';
    END IF;
    INSERT INTO public.camps
        (id, name, manager_name, manager_phone, phone, is_active, subscription_expiry)
    VALUES
        (target_camp_id, target_name, target_manager_name, target_phone, target_phone, TRUE, target_expiry);
    INSERT INTO public.users (id, username, role, camp_id, name)
    VALUES (target_user_id, target_username, 'admin', target_camp_id, target_name);
    RETURN jsonb_build_object('camp_id', target_camp_id, 'user_id', target_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_camp_data(target_camp_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    family_count BIGINT; nomination_count BIGINT; request_count BIGINT;
    profile_count BIGINT; deleted_camp_count BIGINT;
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'service role required' USING errcode = '42501';
    END IF;
    SELECT count(*) INTO family_count FROM public.families WHERE camp_id = target_camp_id;
    SELECT count(*) INTO nomination_count FROM public.nominations WHERE camp_id = target_camp_id;
    SELECT count(*) INTO request_count FROM public.renewal_requests WHERE camp_id = target_camp_id;
    SELECT count(*) INTO profile_count FROM public.users WHERE camp_id = target_camp_id;
    DELETE FROM public.camps WHERE id = target_camp_id;
    GET DIAGNOSTICS deleted_camp_count = ROW_COUNT;
    IF deleted_camp_count <> 1 THEN RAISE EXCEPTION 'camp not found' USING errcode = 'P0002'; END IF;
    RETURN jsonb_build_object('families', family_count, 'nominations', nomination_count,
        'renewalRequests', request_count, 'users', profile_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_renewal_request(
    target_request_id TEXT, target_camp_id TEXT, months_to_add INTEGER DEFAULT 1
) RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed BIGINT;
BEGIN
    IF NOT private.is_superadmin() THEN
        RAISE EXCEPTION 'superadmin required' USING errcode = '42501';
    END IF;
    UPDATE public.renewal_requests SET status = 'approved'
    WHERE id = target_request_id AND camp_id = target_camp_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'renewal request not found' USING errcode = 'P0002'; END IF;
    UPDATE public.camps
    SET subscription_expiry = greatest(coalesce(subscription_expiry, now()), now())
        + make_interval(months => greatest(coalesce(months_to_add, 1), 1)),
        is_active = TRUE
    WHERE id = target_camp_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'camp not found' USING errcode = 'P0002'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_camp_profile(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_camp_data(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_renewal_request(TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_camp_profile(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT)
TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_camp_data(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.approve_renewal_request(TEXT, TEXT, INTEGER) TO authenticated;


-- ========================================================
-- تفعيل التحديثات الفورية (Realtime) للجداول
-- ========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    public.families,
    public.nominations,
    public.announcements;
COMMIT;

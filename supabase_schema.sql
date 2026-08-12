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

-- 3. جدول المخيمات (camps)
CREATE TABLE IF NOT EXISTS public.camps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    manager_name TEXT,
    phone TEXT,
    families_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_expiry TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة المخيمات في حال وجود الجدول سابقاً
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS families_count INTEGER DEFAULT 0;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ;
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. جدول المستخدمين والمصادقة (users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    camp_id TEXT NOT NULL DEFAULT 'kareem',
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث أعمدة المستخدمين
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS camp_id TEXT DEFAULT 'kareem';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- إضافة البيانات الافتراضية الأولية (Initial Data)
-- ========================================================

-- إضافة المخيمات الافتراضية
INSERT INTO public.camps (id, name, location, manager_name, phone, is_active, subscription_expiry)
VALUES 
  ('kareem', 'مخيم كريم', 'غزة - الوسطى', 'أبو كريم', '0599000000', TRUE, NOW() + INTERVAL '1 year'),
  ('zad-al-khair', 'مخيم زاد الخير', 'غزة - خانيونس', 'أبو أحمد', '0599111111', TRUE, NOW() + INTERVAL '1 year')
ON CONFLICT (id) DO UPDATE SET
  location = EXCLUDED.location,
  manager_name = EXCLUDED.manager_name,
  phone = EXCLUDED.phone;

-- ملاحظة: يتم إنشاء المستخدمين وكلمات المرور المشفرة عبر Supabase Auth و API التشفير بالخادم
-- لا تقم بإدراج كلمات مرور مكشوفة (Plaintext) في قاعدة البيانات مباشرة.

-- ========================================================
-- سياسات الأمان والحماية المتقدمة (Row Level Security - RLS)
-- ========================================================

-- 1. دوال مساعدة لربط جلسة Supabase Auth بالدواعي والأدوار
CREATE OR REPLACE FUNCTION public.get_current_user_camp_id()
RETURNS TEXT AS $$
  SELECT camp_id FROM public.users WHERE id = auth.uid()::text
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text AND role = 'superadmin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

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

    -- 1. جدول العائلات (تطبيق عزل البيانات بين المخيمات)
    ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "families_camp_isolation" ON public.families FOR ALL TO authenticated
    USING (is_superadmin() OR camp_id = get_current_user_camp_id())
    WITH CHECK (is_superadmin() OR camp_id = get_current_user_camp_id());

    -- 2. جدول الترشيحات (تطبيق عزل البيانات بين المخيمات)
    ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "nominations_camp_isolation" ON public.nominations FOR ALL TO authenticated
    USING (is_superadmin() OR camp_id = get_current_user_camp_id())
    WITH CHECK (is_superadmin() OR camp_id = get_current_user_camp_id());

    -- 3. جدول المخيمات
    ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "camps_access_policy" ON public.camps FOR ALL TO authenticated
    USING (is_superadmin() OR id = get_current_user_camp_id());

    -- 4. جدول المستخدمين (حظر الاستعلام المباشر لغير المالك أو المشرف العام مع السماح بالتحقق عند تسجيل الدخول)
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "users_self_or_superadmin" ON public.users FOR ALL TO authenticated
    USING (is_superadmin() OR id = auth.uid()::text);

    DROP POLICY IF EXISTS "users_login_lookup" ON public.users;
    CREATE POLICY "users_login_lookup" ON public.users FOR SELECT TO anon USING (true);

    -- 5. جدول طلبات التجديد
    ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "renewal_requests_isolation" ON public.renewal_requests FOR ALL TO authenticated
    USING (is_superadmin() OR camp_id = get_current_user_camp_id());

    -- 6. جدول الإعلانات (متاح للقراءة لجميع المستخدمين الموثقين، وللتعديل للمشرف العام فقط)
    ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "announcements_read_authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
    CREATE POLICY "announcements_write_superadmin" ON public.announcements FOR ALL TO authenticated USING (is_superadmin());
END $$;

-- دالة مساعدة آمنة للتحقق من تسجيل الدخول للمستخدمين المعرفين يدوياً في Supabase
CREATE OR REPLACE FUNCTION public.get_user_for_login(p_username TEXT)
RETURNS SETOF public.users
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM public.users WHERE lower(username) = lower(p_username) LIMIT 1;
$$;


-- ========================================================
-- تفعيل التحديثات الفورية (Realtime) للجداول
-- ========================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
COMMIT;

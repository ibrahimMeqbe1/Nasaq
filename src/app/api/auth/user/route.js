import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../../lib/supabase";
import { hashPassword } from "../../../../lib/auth";

export async function POST(request) {
  try {
    const { username, password, role, campId, name } = await request.json();

    const cleanUser = (username || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم وكلمة المرور مطلوبة لإكمال العملية" },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(cleanPass);
    const email = cleanUser.includes("@") ? cleanUser : `${cleanUser.toLowerCase()}@camp.com`;

    if (isSupabaseConfigured && supabase) {
      // 1. إنشاء حساب المصادقة السحابية في Supabase Auth إن لم يكن موجوداً
      let userId = `user-${Date.now()}`;
      try {
        const { data: signUpData } = await supabase.auth.signUp({
          email,
          password: cleanPass,
          options: {
            data: {
              username: cleanUser,
              role: role || "admin",
              campId: campId || "kareem",
              name: name || cleanUser,
            },
          },
        });
        if (signUpData?.user?.id) {
          userId = signUpData.user.id;
        }
      } catch (authErr) {
        console.warn("Supabase auth signUp warning:", authErr);
      }

      // 2. تخزين بيانات المستخدم في جدول public.users بالكلمة المشفرة فقط
      const { error: dbError } = await supabase.from("users").upsert([
        {
          id: userId,
          username: cleanUser,
          password: hashedPassword,
          role: role || "admin",
          camp_id: campId || "kareem",
          name: name || cleanUser,
        },
      ]);

      if (dbError) {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم إنشاء/تحديث حساب المستخدم وتشفير كلمة المرور بنجاح",
      user: {
        username: cleanUser,
        role: role || "admin",
        campId: campId || "kareem",
        name: name || cleanUser,
      },
    });
  } catch (error) {
    console.error("Auth User API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء حفظ المستخدم في الخادم" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { campId, adminUsername, adminPassword, name } = await request.json();

    if (!campId) {
      return NextResponse.json(
        { success: false, error: "معرّف المخيم مطلوب" },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const userPayload = {};
      if (adminUsername) userPayload.username = adminUsername;
      if (adminPassword) userPayload.password = hashPassword(adminPassword);
      if (name) userPayload.name = name;

      if (Object.keys(userPayload).length > 0) {
        const { error } = await supabase.from("users").update(userPayload).eq("camp_id", campId);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth User API update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء تحديث بيانات المستخدم" },
      { status: 500 }
    );
  }
}

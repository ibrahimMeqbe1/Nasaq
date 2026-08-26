import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbFindOne } from "../../../../lib/db";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

const invalidCredentials = () =>
  NextResponse.json(
    { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
    { status: 401 }
  );

async function resolveProfileByLogin(username) {
  if (!username) return null;
  const clean = username.trim();

  // 1. البحث المباشر باسم المستخدم (case-insensitive)
  let user = await dbFindOne("users", { username: clean });
  if (user) return user;

  // 2. البحث عن المخيم بالمعرف أو الاسم
  const [campById, campByName] = await Promise.all([
    dbFindOne("camps", { id: clean }),
    dbFindOne("camps", { name: clean }),
  ]);

  const camp = campById || campByName;
  if (camp) {
    user = await dbFindOne("users", { campId: camp.id, role: "admin" });
    if (user) return user;
  }

  // 3. البحث بالاسم الكامل للمستخدم
  user = await dbFindOne("users", { name: clean });
  if (user) return user;

  // 4. مطابقة المرادفات العربية الشائعة (مثل: إبراهيم / ابراهيم / كريم / زاد الخير)
  const norm = clean.replace(/[إأآا]/g, "ا").toLowerCase();
  if (norm.includes("ابراهيم") || norm === "ibrahim" || norm === "superadmin" || norm === "admin") {
    return await dbFindOne("users", { role: "superadmin" });
  }
  if (norm.includes("كريم") || norm.includes("y2000") || norm.includes("i2000") || norm === "kareem") {
    return await dbFindOne("users", { campId: "kareem", role: "admin" });
  }
  if (norm.includes("زاد") || norm.includes("zad")) {
    return await dbFindOne("users", { campId: "zad-al-khair", role: "admin" });
  }

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || password.length < 6 || username.length > 254 || password.length > 256) {
      return invalidCredentials();
    }

    // استعلام سريع متوازي لجلب الملف والمخيم
    const [user] = await Promise.all([
      resolveProfileByLogin(username),
    ]);

    if (!user) {
      return invalidCredentials();
    }

    // التحقق من كلمة المرور
    let passwordMatches = false;
    if (user.passwordHash) {
      passwordMatches = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      passwordMatches = user.password === password;
    }

    if (!passwordMatches) {
      return invalidCredentials();
    }

    // جلب بيانات المخيم إذا كان مديراً
    let camp = null;
    if (user.campId && user.campId !== "system") {
      camp = await dbFindOne("camps", { id: user.campId });
    }

    // إنشاء رمز الجلسة JWT
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      campId: user.campId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uid: user.id,
        username: user.username,
        role: user.role,
        campId: user.campId,
        name: user.name || user.username,
        camp: camp
          ? {
              id: camp.id,
              name: camp.name,
              managerName: camp.managerName,
              managerPhone: camp.managerPhone,
              address: camp.address,
              isActive: camp.isActive,
              subscriptionExpiry: camp.subscriptionExpiry,
              logoUrl: camp.logoUrl,
            }
          : null,
      },
      redirectPath: user.role === "superadmin" ? "/super-admin" : "/",
    });

    setSessionCookie(response, token);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Auth API login error:", error);
    return NextResponse.json(
      { success: false, error: "تعذر تسجيل الدخول الآن. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}

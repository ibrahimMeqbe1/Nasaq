import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../../lib/session";
import { dbFindOne } from "../../../../lib/db";

export async function GET(request) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await dbFindOne("users", { id: payload.userId });
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let camp = null;
    if (user.campId && user.campId !== "system") {
      camp = await dbFindOne("camps", { id: user.campId });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        uid: user.id,
        username: user.username,
        role: user.role,
        campId: user.campId,
        name: user.name || user.username,
        camp,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

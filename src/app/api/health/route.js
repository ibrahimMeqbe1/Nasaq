import { NextResponse } from "next/server";
import { dbCount, isMongoConfigured } from "../../../lib/db";

export async function GET() {
  try {
    const start = performance.now();
    const [campsCount, usersCount, familiesCount, nominationsCount] = await Promise.all([
      dbCount("camps"),
      dbCount("users"),
      dbCount("families"),
      dbCount("nominations"),
    ]);
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      status: "healthy",
      platform: "Nasaq Humanitarian Platform",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      database: {
        engine: isMongoConfigured ? "MongoDB Atlas" : "SQLite Relational Engine (WAL Mode)",
        latencyMs: durationMs,
        counts: {
          camps: campsCount,
          users: usersCount,
          families: familiesCount,
          nominations: nominationsCount,
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}

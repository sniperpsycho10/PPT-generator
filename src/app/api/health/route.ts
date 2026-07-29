import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

export async function GET() {
  const status: Record<string, string> = {
    database: "unknown",
    storage: "unknown"
  };

  let isHealthy = true;

  try {
    // 1. Check Database Connectivity
    await prisma.$queryRaw`SELECT 1`;
    status.database = "ok";
  } catch (error) {
    status.database = "error";
    isHealthy = false;
    logger.error("Healthcheck: Database connection failed", error);
  }

  try {
    // 2. Check Storage Access
    const uploadDir = path.resolve(process.cwd(), "data", "uploads");
    await fs.access(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    status.storage = "ok";
  } catch (error) {
    status.storage = "error";
    isHealthy = false;
    logger.error("Healthcheck: Storage access failed", error);
  }

  // 3. Monitor failed tasks
  let failedReportsCount = 0;
  if (status.database === "ok") {
    try {
      failedReportsCount = await prisma.generatedReport.count({
        where: { status: "Failed" }
      });
    } catch (e) {
      // ignore
    }
  }

  return NextResponse.json(
    {
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
      services: status,
      metrics: {
        failedPPTGenerations: failedReportsCount
      }
    },
    { status: isHealthy ? 200 : 503 }
  );
}

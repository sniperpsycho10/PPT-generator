import { NextResponse } from "next/server";
import { logger } from "./logger";

type RouteHandler = (req: Request, props?: any) => Promise<NextResponse>;

export function withApiHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, props?: any) => {
    try {
      return await handler(req, props);
    } catch (error: any) {
      const path = req.url ? new URL(req.url).pathname : "unknown";
      
      logger.error(`API Error in ${path}`, error, {
        method: req.method,
        path
      });

      // Avoid leaking internal errors to the client
      const isDev = process.env.NODE_ENV === "development";
      const message = isDev ? error.message : "Internal Server Error";

      return NextResponse.json(
        { success: false, error: message },
        { status: error.status || 500 }
      );
    }
  };
}

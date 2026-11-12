import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getApiUser, type CurrentUser } from "@/lib/auth";
import { RateLimitError } from "@/lib/rate-limit";

type Handler<C> = (request: NextRequest, ctx: { user: CurrentUser; params: C }) => Promise<unknown>;

function hasStatus(e: unknown): e is { status: number; message: string } {
  return typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number";
}

/**
 * Wraps a route handler with auth, JSON serialisation and consistent error
 * responses. Responses are private (never cached by shared caches).
 */
export function apiRoute<C = Record<string, string>>(handler: Handler<C>) {
  return async (request: NextRequest, context: { params: Promise<C> }) => {
    const user = await getApiUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const params = await context.params;
      const body = await handler(request, { user, params });
      return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: error.issues[0]?.message ?? "Invalid request" },
          { status: 400 },
        );
      }
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message },
          { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
        );
      }
      if (hasStatus(error) && error.status >= 400 && error.status < 600) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("[api]", request.nextUrl.pathname, error);
      return NextResponse.json({ error: "The data source is unavailable right now." }, { status: 502 });
    }
  };
}

export function searchParamsObject(request: NextRequest): Record<string, string> {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

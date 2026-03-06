import { handlers } from "@/lib/auth";
import { rateLimit, rateLimitConfigs, getClientIdentifier } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// Only rate-limit POST (login attempts), not GET (session checks, providers, csrf)
function createRateLimitedPost(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    // Only rate-limit credential submission (callback/credentials)
    const url = new URL(request.url);
    const isLoginAttempt = url.pathname.includes("/callback/credentials");

    if (isLoginAttempt) {
      const identifier = getClientIdentifier(request);
      const result = rateLimit(identifier, rateLimitConfigs.auth);

      if (!result.success) {
        return NextResponse.json(
          {
            error: "Too many requests",
            message: "Please try again later",
            resetAt: new Date(result.resetAt).toISOString(),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": result.limit.toString(),
              "X-RateLimit-Remaining": result.remaining.toString(),
              "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
              "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }

    return handler(request);
  };
}

export const GET = handlers.GET;
export const POST = createRateLimitedPost(handlers.POST);

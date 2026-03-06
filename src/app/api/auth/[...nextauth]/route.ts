import { handlers } from "@/lib/auth";
import { rateLimit, rateLimitConfigs, getClientIdentifier } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createRateLimitedHandler(handler: any) {
  return async (request: Request) => {
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

    const response = await handler(request);

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-RateLimit-Limit", result.limit.toString());
      newHeaders.set("X-RateLimit-Remaining", result.remaining.toString());
      newHeaders.set("X-RateLimit-Reset", new Date(result.resetAt).toISOString());

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return response;
  };
}

export const GET = createRateLimitedHandler(handlers.GET);
export const POST = createRateLimitedHandler(handlers.POST);

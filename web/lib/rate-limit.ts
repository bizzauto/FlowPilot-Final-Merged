import { redis } from "@/lib/redis";
import { ApiError } from "@/lib/api-error";

export async function rateLimit(identifier: string, limit = 100, windowSeconds = 60) {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${identifier}:${window}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (current > limit) {
    throw new ApiError(429, "Too many requests", "RATE_LIMITED");
  }
}
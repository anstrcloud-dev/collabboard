import { RateLimiter } from "limiter"

const limiters = new Map<string, RateLimiter>()

export function getRateLimiter(ip: string): RateLimiter {
  if (!limiters.has(ip)) {
    limiters.set(ip, new RateLimiter({
      tokensPerInterval: 5,
      interval: "minute",
      fireImmediately: true
    }))
  }
  return limiters.get(ip)!
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const limiter = getRateLimiter(ip)
  const remainingRequests = await limiter.removeTokens(1)
  return remainingRequests >= 0
}
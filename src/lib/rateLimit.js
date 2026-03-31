/**
 * Simple in-memory rate limiter to prevent CPU spikes and API abuse
 * For production, consider using Redis-based rate limiting
 */

const rateLimitMap = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit middleware
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {string} options.keyGenerator - Function to generate key (default: IP)
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute default
    maxRequests = 60, // 60 requests per minute default
    keyGenerator = (req) => {
      // Get IP from headers (works with proxies)
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      return ip;
    }
  } = options;

  return async (req) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    const record = rateLimitMap.get(key);
    
    if (!record || now > record.resetTime) {
      // New window
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (record.count >= maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: record.resetTime
      };
    }
    
    record.count++;
    return { 
      allowed: true, 
      remaining: maxRequests - record.count 
    };
  };
}

/**
 * Strict rate limiter for sensitive endpoints (password login, contact form, etc.)
 * Note: OTP flows use otpSendRateLimit / otpVerifyRateLimit so users are not locked out after a few tries.
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

/** SMS OTP send — separate bucket from verify so retries are usable */
export const otpSendRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  keyGenerator: (req) => {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "unknown";
    return `otp-send:${ip}`;
  },
});

/** OTP verify — allow more attempts (typos, expiry) */
export const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 40,
  keyGenerator: (req) => {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.headers.get("x-real-ip") || "unknown";
    return `otp-verify:${ip}`;
  },
});

/**
 * Moderate rate limiter for general API endpoints
 */
export const moderateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30 // 30 requests per minute
});

/**
 * Loose rate limiter for public endpoints
 */
export const looseRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
});

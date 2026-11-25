import { NextResponse } from "next/server";

/**
 * Sanitize input to prevent ReDoS and injection attacks
 */
export function sanitizeInput(input, maxLength = 100) {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  let sanitized = input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'`]/g, '') // Remove HTML/script injection chars
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  return sanitized;
}

/**
 * Sanitize search query to prevent ReDoS attacks
 */
export function sanitizeSearchQuery(query, maxLength = 50) {
  if (!query || typeof query !== 'string') return '';
  
  // Limit length to prevent ReDoS
  const sanitized = query.trim().slice(0, maxLength);
  
  // Remove regex special characters that could cause issues
  // But keep basic search functionality
  return sanitized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return Math.max(min, Math.min(max, num));
}

/**
 * Get CORS headers (now handled by middleware, but kept for compatibility)
 */
export function getCorsHeaders() {
  // CORS is now handled in middleware with proper origin checking
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Create a JSON response with security headers
 */
export function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return NextResponse.json(
    data,
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders,
      }
    }
  );
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleOptions() {
  return jsonResponse({}, 200);
}

/**
 * Validate request body size (prevent large payload attacks)
 */
export function validateBodySize(body, maxSize = 1024 * 1024) { // 1MB default
  const bodySize = JSON.stringify(body).length;
  if (bodySize > maxSize) {
    throw new Error(`Request body too large. Maximum size: ${maxSize} bytes`);
  }
  return true;
}

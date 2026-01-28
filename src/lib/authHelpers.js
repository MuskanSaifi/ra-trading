import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import AdminSetting from "@/models/AdminSetting";

/**
 * Verify admin authentication token
 * Returns { success: true, adminId } if valid, or throws error
 */
export async function verifyAdminAuth(req) {
  try {
    // Try to get token from cookies first (preferred)
    const cookieStore = await cookies();
    let token = cookieStore.get("adminToken")?.value;

    // If not in cookies, try Authorization header
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return {
        success: false,
        error: "Unauthorized - No token provided",
        status: 401,
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify admin exists in database
    const admin = await AdminSetting.findById(decoded.adminId);
    if (!admin) {
      return {
        success: false,
        error: "Unauthorized - Admin not found",
        status: 401,
      };
    }

    return {
      success: true,
      adminId: decoded.adminId,
      admin,
    };
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return {
        success: false,
        error: "Unauthorized - Invalid or expired token",
        status: 401,
      };
    }
    return {
      success: false,
      error: "Authentication error",
      status: 500,
    };
  }
}

/**
 * Middleware wrapper for admin routes
 * Use this to protect admin endpoints
 */
export function requireAdminAuth(handler) {
  return async (req, context) => {
    const authResult = await verifyAdminAuth(req);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Add admin info to request context
    req.adminId = authResult.adminId;
    req.admin = authResult.admin;

    return handler(req, context);
  };
}

/**
 * Validate file type and size for uploads
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"],
  } = options;

  // Check file exists
  if (!file || !file.size) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // Check file extension
  const fileName = file.name || "";
  const extension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${allowedExtensions.join(", ")}`,
    };
  }

  // Additional security: Check file signature (magic bytes)
  // This prevents malicious files with fake extensions
  // Note: This requires reading file buffer, which should be done in the route handler

  return { valid: true };
}

/**
 * Validate image file buffer by checking magic bytes
 */
export function validateImageBuffer(buffer) {
  // JPEG: FF D8 FF
  const isJPEG = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  
  // PNG: 89 50 4E 47
  const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  
  // WebP: Check for "WEBP" string at offset 8
  const isWebP = buffer.length > 12 && 
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isJPEG && !isPNG && !isWebP) {
    return {
      valid: false,
      error: "Invalid image file. File signature does not match image format.",
    };
  }

  return { valid: true };
}

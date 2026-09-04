import jwt from "jsonwebtoken";

/**
 * Verifies the JWT from the Authorization header.
 * Attaches { id, username, role, doctorName } to req.user on success.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Missing or invalid Authorization header" }
    });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" }
    });
  }
}

/**
 * Restricts a route to specific roles. Use AFTER requireAuth.
 * Example: router.post("/x", requireAuth, requireRole("admin"), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to do this" }
      });
    }
    next();
  };
}
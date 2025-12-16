import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import database from "../database/db.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Accept token from cookie OR Authorization header (Bearer)
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authHeader && String(authHeader).startsWith("Bearer ")) {
      token = String(authHeader).split(" ")[1];
    }
  }

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource.", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    // Provide a clearer message and avoid leaking internals
    return next(new ErrorHandler("Invalid or expired token, please login again.", 401));
  }

  const user = await database.query(
    "SELECT * FROM users WHERE id = $1 LIMIT 1",
    [decoded.id]
  );
  if (!user.rows || user.rows.length === 0) {
    return next(new ErrorHandler("User for provided token not found.", 401));
  }
  req.user = user.rows[0];
  next();
})

export const authorizedRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
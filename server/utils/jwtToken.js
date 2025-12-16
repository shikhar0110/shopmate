import jwt from "jsonwebtoken";

export const sendToken = (user, statusCode, message, res) => {
    if (!process.env.JWT_SECRET_KEY) {
        throw new Error("JWT_SECRET_KEY is not configured. Cannot sign tokens.");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Ensure numeric cookie expiry (days -> ms)
    const cookieDays = Number(process.env.COOKIE_EXPIRES_IN) || 7;
    const cookieOptions = {
        expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    return res.status(statusCode).cookie("token", token, cookieOptions).json({
        success: true,
        user,
        message,
        token,
    });
};
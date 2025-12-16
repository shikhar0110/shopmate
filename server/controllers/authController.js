import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import { sendToken } from "../utils/jwtToken.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";

export const register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const isAlreadyRegistered = await database.query(
        "SELECT * FROM users WHERE email=$1",
        [email]
    );
    if (isAlreadyRegistered.rows.length > 0) {
        return next(new ErrorHandler("User already registered", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await database.query(
        "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING *",
        [name, email, hashedPassword]
    );
    sendToken(user.rows[0], 201, "user registered successfully", res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    const user = await database.query("SELECT * FROM users where email=$1", [email]);
    if (user.rows.length === 0) {
        return next(new ErrorHandler("Invalid email ", 401));
    }
    const isPasswordMatched = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid password", 401));
    }
    sendToken(user.rows[0], 202, "user logged in  successfully", res);
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
    const { user } = req;
    if (user) delete user.password;
    res.status(200).json({ success: true, user });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    res
        .status(200)
        .cookie("token", null, { expires: new Date(Date.now()), httpOnly: true })
        .json({ success: true, message: "Logged out successfully" });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return next(new ErrorHandler("Please enter all fields", 400));
    }
    if (name.trim().length === 0 || email.trim().length === 0) {
        return next(
            new ErrorHandler(
                "Please enter valid name and email as their length cannot be zero",
                400
            )
        );
    }

    // Handle avatar upload if provided (support form-data uploads)
    let avatarData = req.user?.avatar || {};
    if (req.files && req.files.avatar) {
        const avatar = req.files.avatar;

        // Remove previous avatar if present
        if (req.user?.avatar?.public_id) {
            try {
                await cloudinary.uploader.destroy(req.user.avatar.public_id);
            } catch (err) {
                // Log and continue — failing to destroy old avatar shouldn't block profile update
                console.warn("Failed to destroy old avatar on Cloudinary", err.message || err);
            }
        }

        const newProfileImage = await cloudinary.uploader.upload(avatar.tempFilePath, {
            folder: "Ecommerce_Avatar",
            width: 150,
            crop: "scale",
        });

        avatarData = {
            public_id: newProfileImage.public_id,
            url: newProfileImage.secure_url,
        };
    }

    const userResult = await database.query(
        "UPDATE users SET name=$1, email=$2, avatar=$3 WHERE id=$4 RETURNING *",
        [name, email, avatarData, req.user.id]
    );

    const updatedUser = userResult.rows[0];
    if (updatedUser) delete updatedUser.password;

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
    });
});
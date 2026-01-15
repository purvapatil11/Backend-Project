import crypto from "crypto";
import jwt from "jsonwebtoken";

import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import {
    emailVerificationMailgenContent,
    sendEmail
} from "../utils/mail.js";

/* ======================================================
   ACCESS & REFRESH TOKEN GENERATION
====================================================== */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating tokens"
        );
    }
};

/* ======================================================
   REGISTER USER
====================================================== */
const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }

    const user = await User.create({
        email,
        username,
        password,
        isEmailVerified: false,
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    return res.status(201).json(
        new ApiResponse(201, { user: createdUser }, "User registered successfully")
    );
});

/* ======================================================
   LOGIN USER
====================================================== */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

/* ======================================================
   LOGOUT USER
====================================================== */
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: "" } },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/* ======================================================
   GET CURRENT LOGGED-IN USER
====================================================== */
const getCurrentuser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    );
});

/* ======================================================
   VERIFY EMAIL
====================================================== */
const verifyEmail = asyncHandler(async (req, res) => {
    const { VerificationToken } = req.params;

    if (!VerificationToken) {
        throw new ApiError(400, "Email verification token is missing");
    }

    // Hash token to compare with DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(VerificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, "Token is expired or invalid");
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.isEmailVerified = true;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isEmailVerified: true },
            "Email verified successfully"
        )
    );
});

/* ======================================================
   RESEND EMAIL VERIFICATION
====================================================== */
const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Email already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Verification email sent")
    );
});

/* ======================================================
   REFRESH ACCESS TOKEN
====================================================== */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token expired");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});
/* ======================================================
   FORGOT PASSWORD
====================================================== */
const forgotPasswordRequest = asyncHandler(async(req,res) =>{
    const {email} = req.body
    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User does not exits", [])
    }
    const {unHashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()
    user.forgotPasswordToken = hashedToken
    user.forgotPasswordExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false})

    await sendEmail({
        email: user?.email,
        subject:"Password reset request",
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}`,
        )
    })
})
/* ======================================================
   RESET PASSWORD
====================================================== */
const resetforgotPassword = asyncHandler(async(req,res) =>{
    const { resetToken } = req.params
    const { newPassword } = req.body
    const user = await User.findOne({email})

    let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex")

    await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: {$gt : Date.now()}
    })
    if(!user){
        throw new ApiError(489, "Token is invalid or expired")
    }

    user.forgotPasswordExpiry=undefined
    user.forgotPasswordToken=undefined

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password reset successfully"
        )
    )
})

/* ======================================================
   change current password
====================================================== */
const changeCurrentpassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {},
            "Password changed successfully"
        )
    )
})



/* ======================================================
   EXPORTS
====================================================== */
export {
    registerUser,
    login,
    logoutUser,
    getCurrentuser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetforgotPassword,
    changeCurrentpassword,
};

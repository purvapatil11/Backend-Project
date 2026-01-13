import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";

/* ===============================
   TOKEN GENERATION
================================ */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accesstoken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accesstoken, refreshToken };
    } catch (error) {
        console.error(error);
        throw new ApiError(
            500,
            "something went wrong while generating access token"
        );
    }
};

/* ===============================
   REGISTER USER
================================ */
const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const user = await User.create({
        email,
        username,
        password,
        isEmailVerified: false,
    });

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

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            { user: createdUser },
            "User registered successfully"
        )
    );
});

/* ===============================
   LOGIN USER
================================ */
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

    const { accesstoken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accesstoken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accesstoken,
                    refreshToken,
                },
                "User logged in successfully"
            )
        );
});
const logoutUser = asyncHandler(async(req,res) =>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken:""
            }
        },
        {
            new:true,
        },
    );
    const options = {
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out "));
})
const getCurrentuser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "current user fetched successfully"
        )
    )
})
const verifyEmail = asyncHandler(async(req,res) => {
   const{VerificationToken} = req.params
   if(!verificationToken){
    throw new ApiError(400, "email verification token is missing")
   }
})
// const getCurrentuser = asyncHandler(async(req,res) => {})
// const getCurrentuser = asyncHandler(async(req,res) => {})
/* ===============================
   EXPORTS
================================ */
export { registerUser, login , logoutUser, getCurrentuser};

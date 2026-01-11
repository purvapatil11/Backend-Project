import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js"
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accesstoken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })
        return  {accesstoken, refreshToken}
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while generationg access token",
        )
            }
}
const registerUser = asyncHandler(async(req,res)=>{
    const {email, username, password, role} = req.body

   const existingUser = await User.findOne({
        $or:[{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "User with email or username already exists",[])
    }
    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false
    })
    const { unHashedToken, hashedToken, tokenExpiry } = 
    user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken
    user.emailVerificationToken = tokenExpiry

    await user.save({validateBeforeSave : false})

    await sendEmail(
        {
            email: user?.email,
            subject:"please verify your email",
            mailgenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get('host')}/api/v1/users/verify-email/${unHashedToken}`,
            )
        }
    )
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken  -emailVerificationToken -emailverificationExpiry"
    )
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering a user")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {user, createdUser , ApiResponse}, 
            "User registered successfully"
        )
    )

})
export { registerUser };
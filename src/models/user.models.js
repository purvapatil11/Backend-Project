import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
const userSchema = new Schema(
    {
        avatar:{
            type:{
                url:String,
                localPath:String,

            },
        username:{
            type:String,
            required: true,
            // unique:true,
            // lowercase:true,
            // index:true,
            // trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
            lowercase:true
        },
        fullName:{
            type:String,
            trim: true,
        },
        password:{
            type:String,
            required:[true, "Password is required"]
        },
        isEmailVerified:{
            type:Boolean,
            default:false
        },
        refreshToken:{
            type:String,
        },
        forgotPasswordToken:{
            type:String
        },
        forgotPasswordExpiry:{
            type:date
        },
        emailVerificationToken:{
            type:string
        },
        emailVerificationExpiry:{
            type:date
        },
            default:{
                url:`https://placehold.co/200*200`,
                localPath:""
            }
        }
    },{
        timestamps:true,
        createdAt:true,
    }
)
//hooks 
userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password, this.password)
};

userSchema.methods.genrateAccessToken = function(){
    return jwt.sign(
        //payload
        {
            _id:this._id,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username:this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_SECRET}
)
}
userSchema.methods.generateTemporaryToken = function(){
        const unhashedToken = crypto.randomBytes(20).toString("hex")
        const hashedToken = crypto
        .createHash("sha256")
        .update(unhashedToken)
        .digest("hex")
        const tokenExpiry = Date.now() + (20*60*100) //20mins
        return { unhashedToken, hashedToken, tokenExpiry}
}
export const User =  mongoose.model("User", userSchema);

import mongoose, { Schema } from "mongoose";
import {AvailableUserRole, UserRoleEnum} from "../utils/constants.js"

const projectMemberSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    projects:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    role:{
        type:String,
        enum: AvailableUserRole,
        dafault:UserRoleEnum.MEMBER
    }

},{timestamps:true})
export const projectMember = mongoose.model("ProjectMember", projectMemberSchema)
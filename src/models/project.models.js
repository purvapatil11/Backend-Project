import mongoose, { Schema } from "mongoose";
const projectSchema = new Schema({
    name:{
        type: String,
        Unique:true,
        trim:true,
        required:true,
    },
    description:{
        type:String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true,
    }
}, { timestamps:true })

export const Project= mongoose.model("Project", projectSchema)
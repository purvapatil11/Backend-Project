import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js"

export const validate = (req, res) =>{
    const errors = validationResult(req)
    if(errors.isEmpty()){
            return 
    }
    const extractedErrors = []
    errors.array().map((err) => extractedErrors.push({
        [err.path]: err.msg
    }))
    throw new ApiError(402, "Recieved data is not valid", extractedErrors)
}
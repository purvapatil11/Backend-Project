import { body } from "express-validator";


/* ======================================================
   USER REGISTER VALIDATORS
====================================================== */
const userRegisterValidators = () => {
    return [
        //methods on validators
        body("email")
        .trim()
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("Email is invalid"),

        body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is rqeuired")
        .isLowercase()
        .withMessage("username must be in lowercase")
        .isLength({min: 3})
        .withMessage("username must be atleast 3 characters long"),

        body("password")
        .trim()
        .notEmpty()
        .withMessage("cannot be empty"),

        body("fullname")
        .optional()
        .trim(),

    ]
}
/* ======================================================
   USER LOGIN VALIDATORS
====================================================== */
const userLoginvalidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .isEmail()
            .withMessage("email is invalid"),

        body("password")
            .notEmpty()
            .withMessage("password is required")
    ];
};
/* ======================================================
   CHANGE CURRENT PASSWORD
====================================================== */
const userChangeCurrentPasswordValidators = () =>{
    return [
        body("oldPassword").notEmpty().withMessage("old password is required"),
        body("newPassword").notEmpty().withMessage("new password is required"),
    ]
}
/* ======================================================
   USER FORGOT PASSWORD
====================================================== */
const userForgotPasswordValidator = ()=>{
    return [
        body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),
    ]
}
/* ======================================================
   USER RESET FORGOT PASSWORD
====================================================== */
const userResetForgotPasswordvalidator = () => {
    return [
        body("newPassword")
        .notEmpty()
        .withMessage("Password is required")
    ]
}
export {
    userRegisterValidators,
     userLoginvalidator,
     userChangeCurrentPasswordValidators,
     userForgotPasswordValidator,
     userResetForgotPasswordvalidator
     
}
import { body } from "express-validator";

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

export {
    userRegisterValidators, userLoginvalidator
}
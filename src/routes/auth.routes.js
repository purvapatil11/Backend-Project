import {Router} from "express"
import { logoutUser, registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validators.middleware.js";
import { userRegisterValidators , userLoginvalidator } from "../validatiors/index.js";
import { login } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router();
// router.route("/register").post(registerUser)
router.post("/register", userRegisterValidators(), validate, registerUser);
 //register user securely 
//  collect all the errors using userRegisterValidators
//  pass it to the middlewares if it is correct throw error or go ahead 
//  and get user registered throught registerUser
router.post("/login",userLoginvalidator(),validate, login);

//secure routes
router.post("/logout",verifyJWT, logoutUser);



export default router;
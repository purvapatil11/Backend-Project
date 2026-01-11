import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    avatar: {
      url: {
        type: String,
        default: "https://placehold.co/200x200"
      },
      localPath: {
        type: String,
        default: ""
      }
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    fullName: {
      type: String,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    refreshToken: {
      type: String
    },

    forgotPasswordToken: {
      type: String
    },

    forgotPasswordExpiry: {
      type: Date
    },

    emailVerificationToken: {
      type: String
    },

    emailVerificationExpiry: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password"));

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  );
};

// Refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  );
};

// Email / password reset token
userSchema.methods.generateTemporaryToken = function () {
  const unhashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000; // 20 minutes

  return { unhashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);

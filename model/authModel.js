import mongoose from 'mongoose';

// ----------------REGISTER MODEL-----------
const registerUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    gender: {
        type: Number,
        enum: [0, 1, 2], // 0: Male, 1: Female, 2: Other
        required: [true, 'Gender is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true
    },
    profile_pic: {
        type: String,
        require: true,
        trim: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const UserModel = mongoose.model('User', registerUserSchema);

// ----------------LOGIN MODEL-----------
const loginUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email or username is required']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    }
});

const LoginModel = mongoose.model('Login', loginUserSchema);

// -----------------OTP MODEL--------------
const otpSchema = new mongoose.Schema( {
    otp: { type: Number, default: null },
    email: { type: String, required: [true, "Email is required"] },
    otpExpiry: { type: Number, default: null },
    isVerified: {type: Boolean, default: false}
} )

const OtpModel = mongoose.model('Otp', otpSchema );

export {UserModel, LoginModel, OtpModel}
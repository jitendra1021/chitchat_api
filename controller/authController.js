import { OtpModel, UserModel } from '../model/authModel.js';
import bcrypt from 'bcryptjs';
import appUtils from '../utils/appUtils.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import validation from '../utils/validation.js';
import sendEmail from '../utils/nodemailer.js';


const verifyOTPHandler = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if(!(email?.trim()?.toLowerCase())){
            return next(appUtils.handleError("Email is required", 400))
        }

        if (!otp || String(otp)?.length !== 6) {
            return next(appUtils.handleError("6 digit OTP is required", 400));
        }

        const userOtpDoc = await OtpModel.findOne({ email });
    
        if (!userOtpDoc) {
            return next(appUtils.handleError("User does not exists", 400));
        }
    
        if (userOtpDoc.otpExpiry < Date.now()) {
            return next(appUtils.handleError("OTP expired", 400));
        }
    
        if (userOtpDoc?.otp === parseInt(otp)) {
           await OtpModel.updateOne(
                    { email },
                    { $set: { isVerified: true }, 
                    // $unset: { otp: "", otpExpiry: "" } 
                });
            return res.status(200).json({message:"OTP verified successfully", status: true});
        } else {
            return next(appUtils.handleError("Invalid OTP", 400));
        } 
        
    } catch (error) {
        return next (appUtils.handleError("Failed to verify OTP", 400))
    }
};

// const verifyOTPHandler = async (otp, email) => {
//     if (!otp || String(otp).length !== 6) {
//         throw appUtils.handleError("6 digit OTP is required", 400);
//     }
//     const userOtpDoc = await OtpModel.findOne({ email });

//     if (!userOtpDoc) {
//         throw appUtils.handleError("firstly verify email then register", 400);
//     }

//     if (userOtpDoc.otpExpiry < Date.now()) {
//         throw appUtils.handleError("OTP expired", 400);
//     }

//     if (userOtpDoc?.otp === parseInt(otp)) {
//         await OtpModel.deleteOne({ email });
//         return true;
//     } else {
//         throw appUtils.handleError("Invalid OTP", 400);
        
//     } 
// };

const registerHandler = async (req, res, next) => {
    try {
        const {name, email, username, password, gender, otp } = req.body;
        const profilePic = req?.file ?? null;

        if( !name || !email?.trim() || !username || !password || gender === undefined || gender === null  ) return next(appUtils?.handleError("Fill all input fields", 400));

        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));
        if (!validation.isPasswordStrong(password)) 
        return next(appUtils?.handleError("Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character", 400));
        if (![0, 1, 2].includes(Number(gender))) return next(appUtils?.handleError("Invalid gender value", 400));
        if(! profilePic) return next(appUtils?.handleError("Upload profile Picture", 400));
        
        const isUserExists = await UserModel.findOne({email});
        if(isUserExists) return next(appUtils?.handleError("User already exists", 400));

        const isUserVerified = await OtpModel.findOne({email});
        if( ! isUserVerified || ! isUserVerified?.isVerified ){
            return next( appUtils.handleError("Email is not verified, verify first"),400 );
        }

        // await verifyOTPHandler(otp, email);
    
        const uploadedFileUrl = await uploadOnCloudinary(profilePic?.path);
                
        if(uploadedFileUrl) {
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await UserModel.create({
                name: name, 
                username: username, 
                gender:gender,
                email: email,
                password: hashedPassword,
                profile_pic: uploadedFileUrl,
                isEmailVerified: true
            })

            await OtpModel.deleteOne({ email });

            return res.status(200).json({ message: "User verified and registered successfully", data:newUser });
            

        } else {
            return next(appUtils?.handleError("Failed to upload profile Image to cloudinary", 500));
        }

    } catch (error) {
        return next(appUtils?.handleError(error, 500));
    }
} 

const sendOTPHandler = async(req, res, next) => {
    try {
        const { email } = req.body;
        if(!email.trim() || email.trim() === "") return next( appUtils?.handleError("Email is required", 400) );
        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpireTime = Date.now() + 2 * 60 * 1000;

        // Update or create user
        let userExists = await UserModel.findOne({ email });

            if (userExists) {
                return next(appUtils?.handleError(`User already exists`, 400)); 
            } else {
                await sendEmail(email, otp);
                // await OtpModel.create({email:email, otp:otp, otpExpiry: otpExpireTime, isVerified: false});
                await OtpModel.findOneAndUpdate(
                    { email },
                    { otp, otpExpiry: otpExpireTime, isVerified: false },
                    { upsert: true, new: true }
                    );
                return res.status(200).json({ message: "OTP sent successfully"});
            }
    } catch (error) {
       return next(appUtils?.handleError(`Failed to send OTP ${error.message}`, 500)); 
    }
}

const resendOTPHandler = async(req, res, next) => {
    try {
        const { email } = req.body;
        if(!email.trim() || email.trim() === "") return next( appUtils?.handleError("Email is required", 400) );
        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpireTime = Date.now() + 2 * 60 * 1000;

        // Update or create user
        let userExists = await OtpModel.findOne({ email });
        // await OtpModel.findOneAndUpdate(
        //     { email },
        //     { otp, otpExpiry: otpExpireTime, isVerified: false },
        //     { upsert: true, new: true }
        // );

            if (userExists) {
                // Send OTP email
                await sendEmail(email, otp);
                
                userExists.otp = otp;
                userExists.otpExpiry = otpExpireTime;
                await userExists.save();
                return res.status(200).json({ message: "OTP resent successfully"});
            } else {
                return next(appUtils?.handleError(`User not found`, 400)); 
            }
    } catch (error) {
       return next(appUtils?.handleError(`Failed to resend OTP. ${error.message}`, 500)); 
    }
}

const loginHandler = async (req, res, next) => {
    
    try {
        const { email, password } = req.body;
        // return
        if( !email || !password) return next(appUtils?.handleError("Email and password are required", 400));

        const user = await UserModel.findOne({email:email});
        if(!user) return next(appUtils?.handleError("User not found, please register", 404));

        const isUserMatch = await bcrypt.compare(password, user?.password );

        if(isUserMatch){
            return res.status(200).json({
                message:"login success", 
                data: {
                    user, 
                    token: appUtils?.generateToken(user?._id, user?.email),
                    refresh_token: appUtils?.generateRefreshToken(user?._id, user?.email)
                }
            });
            
        } else {
            return next(appUtils?.handleError("Invalid user credential", 400));
        }

    } catch (error) {
        return next(appUtils?.handleError(`Login failed ${error?.message}`, 500));
    }
} 

const userDetailHandler = async(req, res, next) => {
    try {
        const userId = req.user?._id;
        console.log(userId,"????")

        if(! userId ){
            return next(appUtils.handleError("Unauthorized: User not logged in", 401));
        }

        const data = await UserModel.findById(userId).select("-password");
        
        if( ! data ) {
            return next (appUtils.handleError("User not found", 401));
        }

        return res.status(200).json( { message: "User details fetched successfully", data: data } )

    } catch (error) {
        return next(appUtils.handleError(`Failed to fetch user details. ${error.message}`, 500));
    }
}

export {registerHandler, sendOTPHandler, resendOTPHandler, loginHandler, userDetailHandler, verifyOTPHandler}
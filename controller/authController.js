import { OtpModel, UserModel } from '../model/authModel.js';
import bcrypt from 'bcryptjs';
import appUtils from '../utils/appUtils.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import validation from '../utils/validation.js';
import sendEmail from '../utils/nodemailer.js';
import jwt from 'jsonwebtoken';



const verifyOTPHandler = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if(!(email?.trim()?.toLowerCase())){
            return next(appUtils.handleError("Email is required", 400))
        }

        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));

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
        return next (appUtils.handleError(`Failed to verify OTP ${error?.message} `, 400))
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
        const {name, email, username, password, gender} = req.body;
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
        const email  = req.body?.email ??"";
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
        const email = req.body?.email ?? "";
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
        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));

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

        if(! userId ){
            return next(appUtils.handleError("Unauthorized: User not logged in", 401));
        }

        const data = await UserModel.findById(userId).select("-password");
        
        if( ! data ) {
            return next (appUtils.handleError("Token is required or User not found", 401));
        }

        return res.status(200).json( { message: "User details fetched successfully", data: data } )

    } catch (error) {
        return next(appUtils.handleError(`Failed to fetch user details. ${error.message}`, 500));
    }
}

const updateProfileHandler = async (req, res, next ) =>{
    try {
        const userId = req.user?._id;
        if(! userId ){
            return next(appUtils.handleError("Unauthorized: User not logged in", 401));
        }

        const {name, email, username, gender} = req.body;
        const profile_pic = req.file?? null;

        if (email) {
            return next(appUtils.handleError("Email cannot be updated", 400));
        }

        let uploadedFileUrl = null;

        if(profile_pic){
            uploadedFileUrl = await uploadOnCloudinary(profile_pic?.path);
            
            if (!uploadedFileUrl) {
                return next(appUtils.handleError("Failed to upload profile picture", 400));
            }
        }

        const updateData = {};
        if (name?.trim()) updateData.name = name?.trim();
        if (username?.trim()) updateData.username = username?.trim();
        if (gender !== undefined) updateData.gender = gender;
        if(uploadedFileUrl) updateData.profile_pic =  uploadedFileUrl;

        if (Object.keys(updateData)?.length === 0) {
            return next(appUtils.handleError("No valid fields provided for update", 400));
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
            ).select("-password -__v");

            if (!updatedUser) {
            return next(appUtils.handleError("User not found", 404));
            }

            res.status(200).json({ success: true, message: "Profile updated successfully",data: updatedUser});

    } catch (error) {
        console.error(error);
        return next( appUtils?.handleError(`Failed to update profile ${error?.message}`, 500) )
    }
    
}

const refreshTokenHandler = async (req, res, next) => {
    try {
        const refresh_token = req.body?.refresh_token ??"";

        if (!refresh_token?.trim()) {
            return next(appUtils.handleError("refresh_token is required", 400));
        }

        try {
            const decodedData = jwt.verify(refresh_token?.trim(), process.env.JWT_SECRET_KEY);

            return res.status(200).json({
                message: "Token is refreshed",
                token: appUtils.generateToken(decodedData?._id, decodedData?.email)
            });

        } catch (error) {
            if (error?.name === 'TokenExpiredError') {
                return next(appUtils.handleError('Unauthorized: refresh token is expired. Login to get a new one', 401));
            }
            return next(appUtils.handleError("Unauthorized: Invalid token", 401));
        }

    } catch (error) {
        return next(appUtils.handleError(`Error: ${error?.message}`, 400));
    }
}

const forgotPasHandler = async (req, res, next ) =>{
    try {
        const email  = req.body?.email ?? "";
        const trimedEmail = email?.trim()?.toLowerCase();

        if(!trimedEmail || validation.isEmailValid(trimedEmail) ) {
            return next (appUtils.handleError("Valid email address is required", 400));
        }

        const isUserExists = await UserModel.findOne( {trimedEmail} );

        if(!isUserExists) {
            return next (appUtils.handleError("User does not exists. Register first", 400));
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpireTime = Date.now() + 2 * 60 * 1000;

        await sendEmail(trimedEmail, otp);

        await OtpModel.findOneAndUpdate(
            { trimedEmail },
            { otp, otpExpiry: otpExpireTime, isVerified: false},
            { upsert: true, new: true }
        );

        return res.status(200).json({ message: "Reset password OTP rent successfully"});

    } catch (error) {
        console.log(error)
        return next( appUtils.handleError(`Internal server error ${error?.message}`, 400) )
    }
}

const resetPasHandler = async ( req, res, next ) => {
    try {
        const { email, otp, newPassword } = req.body;

        if( ! email?.trim() ){
            return next( appUtils.handleError("Email is required", 400) )
        }
        if( ! newPassword ){
            return next( appUtils.handleError("New password is required", 400) )
        }

        if (!validation?.isEmailValid(email)) return next(appUtils?.handleError("Please provide a valid email address", 400));

        if (!otp || String(otp)?.length !== 6) {
            return next(appUtils.handleError("6 digit OTP is required", 400));
        } 

        if (!validation.isPasswordStrong(newPassword)) {
            return next(appUtils?.handleError("Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character", 400));
        }

        const isUserExists = await OtpModel.findOne({email});

        if(! isUserExists ) {
            return next(appUtils.handleError("User does not exists", 400));
        }

        if (isUserExists.otpExpiry < Date.now()) {
            return next(appUtils.handleError("OTP expired", 400));
        }

        if (isUserExists?.otp !== otp) {
            return next(appUtils.handleError("Invalid OTP", 400));
        }

        if(! isUserExists.isVerified){
            return next(appUtils.handleError("OTP is not verified. ", 400));
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return next(appUtils.handleError("User not found", 400));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        user.password = hashedPassword;
        await user.save();

        await OtpModel.deleteOne({email});

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
      
    } catch (error) {
        console.log(error);
        return next ( appUtils.handleError(`Error: ${error?.message}`, 500) )
    }
}

const changePasHandler = async (req, res, next) =>{
    try {
        const userId = req.user?._id;
        
        if (! userId) {
            return next( appUtils.handleError("User not found", 400) )
        }

        const { oldPassword, newPassword } = req.body;

        if ( ! oldPassword || ! newPassword ) {
            return next ( appUtils.handleError("Old and new password is required", 400) );
        }

        if (! validation.isPasswordStrong(newPassword) || ! validation.isPasswordStrong(oldPassword) ) {
            return next(appUtils?.handleError(
                "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character", 
                400
            ));
        }

        const user = await UserModel.findById(userId);

        if ( ! user) {
            return next(appUtils.handleError("User not found", 400));
        }
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if(! isMatch) {
            return next ( appUtils.handleError("Old password do not matched", 400) );
        }
         
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        console.log(error);
        return next ( appUtils.handleError(`Internal server error ${error?.message}`, 500) )
    }
}


export { 
    registerHandler, 
    sendOTPHandler, 
    resendOTPHandler, 
    loginHandler, 
    userDetailHandler, 
    verifyOTPHandler, 
    updateProfileHandler, 
    refreshTokenHandler,
    forgotPasHandler,
    resetPasHandler,
    changePasHandler
}
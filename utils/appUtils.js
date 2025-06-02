import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import moment from "moment";
import path from "path";
import fs from "fs";

dotenv.config();

// Ensure upload directory exists
// const dir = "public/uploads";
// if (!fs.existsSync(dir)) {
//   fs.mkdirSync(dir, { recursive: true });
// }

const errorHandler = (errOrMsg, statusCode = 500) => {
  if (typeof errOrMsg === "string") {
    const error = new Error(errOrMsg);
    error.statusCode = statusCode;
    return error;
  }

  if (errOrMsg instanceof Error) {
    errOrMsg.statusCode = errOrMsg?.statusCode || statusCode;
    return errOrMsg;
  }

  const error = new Error("Something went wrong");
  error.statusCode = statusCode;
  return error;
};

const storage = multer.diskStorage({
  // destination: dir,
  destination: "public/uploads",

  filename: (req, file, cb) => {
    const timestamp = moment().unix(); // Current time in seconds
    const ext = path.extname(file?.originalname); // File extension
    const filename = `${file?.fieldname}_${timestamp}${ext}`; // Final filename
    cb(null, filename);
  },
});

// Multer file filter to allow only images
const imageFileFilter = (req, file, cb) => {
  if (file?.mimetype?.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB limit
  fileFilter: imageFileFilter,
}).single("profile_pic");

// Wrapper middleware to catch file size error or other error
const uploadWithErrorHandling = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new Error("File too large. Max size allowed is 6MB."));
      }
      return next(err);
    }

    if (!req?.file) {
      return next(new Error("No file uploaded. Please upload profile pic"));
    }

    next();
  });
};

const appUtils = {
  generateToken: (id, email) => {
    try {
      return jwt.sign({ _id: id, email: email }, process.env.JWT_SECRET_KEY, {
        expiresIn: "1d",
      });
    } catch (error) {
      console.error("Error in generating JWT token:", error);
      throw error;
    }
  },

  generateRefreshToken: (id, email) => {
    try {
      return jwt.sign({ _id: id, email: email }, process.env.JWT_SECRET_KEY, {
        expiresIn: "30d",
      });
    } catch (error) {
      console.error("Error in generating JWT token:", error);
      throw error;
    }
  },
  handleError: errorHandler,
  uploadFile: uploadWithErrorHandling,
};

export default appUtils;

import dotenv from "dotenv";
import multer from "multer";
import moment from "moment";
import path from "path";
import fs from "fs";
import appUtils from "./appUtils.js";

dotenv.config();

// multiple files can be uploaded at same time so this fuction is used, also date can be extracted later.
const generateUniqueId = () => {
  const base36Time = moment().unix().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 11); // 9 characters
  return base36Time + randomPart;
};

// Ensure /tmp/uploads directory exists at runtime
const dir = "/tmp/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const generalStorage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) => {
    // const timestamp = moment().unix();
    const ext = path.extname(file?.originalname);
    // const filename = `${file?.fieldname}_${timestamp}${ext}`;
    const filename = `${file.fieldname}_${generateUniqueId()}${ext}`;
    cb(null, filename);
  },
});

const generalFileFilter = (req, file, cb) => {
  // Accept all files
  cb(null, true);
};

const multiUpload = multer({
  storage: generalStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: generalFileFilter,
}).array("upload_files", 6); // Accept up to 6 files


const uploadAnyFiles = (isRequired = true) => {
  return (req, res, next) => {
    multiUpload(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(appUtils.handleError("File too large. Max allowed size is 10MB.", 400));
        }
        return next(appUtils.handleError(err.message || "File upload error", 400));
      }

      if (isRequired && (!req.files || req.files.length === 0)) {
        return next(appUtils.handleError("No media files uploaded.", 400));
      }

      next();
    });
  };
};
export default uploadAnyFiles;

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env?.CLOUD_NAME,
  api_key: process.env?.CLOUD_API_KEY,
  api_secret: process.env?.CLOUD_API_SECRET_KEY, 
});

const uploadOnCloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath || localFilePath=="") return null
        const response = await cloudinary.uploader.upload( localFilePath, { resource_type:"auto" } );
        return response?.secure_url;
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove the file which is saved locally if upload operation failed
        return null;
    }
}


const uploadMultipleToCloudinary = async (files) => {
  const results = [];

  for (const file of files) {
    try {
      const response = await cloudinary.uploader.upload(file.path, { resource_type: "auto" });
      // results.push({ url: response.secure_url, type: file.mimetype });
      results.push({ success: true, url: response.secure_url, type: file.mimetype });
    } catch (error) {
      results.push({ success: false, file: file.originalname, error: `Failed to upload` });
    } finally {
      // Delete local file regardless of success/failure
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file: ${file.path}`, err);
      });
    }
  }

  return results;
};





export { uploadOnCloudinary, uploadMultipleToCloudinary } ;

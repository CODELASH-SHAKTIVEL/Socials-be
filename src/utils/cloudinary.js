import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadFileOnCloudinary = async (localpathfile) => {
  try {
    if (!localpathfile) {
      console.log('No file path provided.');
      return null;
    }

    console.log('Uploading file to Cloudinary:', localpathfile);

    // Upload the file to Cloudinary
    const file = await cloudinary.uploader.upload(localpathfile, {
      resource_type: 'auto',
    });

    console.log('Cloudinary Upload Response:', file);

    // Remove the temporary file
    fs.unlinkSync(localpathfile);

    // Return an object with the URL
    return { url: file.url };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);

    // Safely remove the temporary file if it exists
    if (fs.existsSync(localpathfile)) {
      fs.unlinkSync(localpathfile);
    }

    return null;
  }
};

export { UploadFileOnCloudinary };

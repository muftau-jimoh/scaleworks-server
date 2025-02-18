
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

/**
 * Uploads a file to Cloudinary and deletes it from local storage after upload.
 * @param {Object} file - The uploaded file object.
 * @param {string} folder - The folder to upload the file to.
 * @returns {Promise<string>} - The URL of the uploaded file.
 */
const uploadToCloudinary = (file, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, {
            resource_type: 'raw',   // Handle raw files (like PDF, DOCX, etc.)
            access_mode: 'public',  // Ensures the file is publicly accessible
            folder: folder  // Specifies the folder to upload the file to
        }, (error, result) => {
            // Delete file after upload attempt
            fs.unlink(file.path, (err) => {
                if (err) console.error(`Error deleting file ${file.path}:`, err);
            });

            if (error) {
                // console.error("Cloudinary Upload Error:", error);
                reject(error);
            } else {
                // console.log("File uploaded successfully:", result.secure_url);
                resolve(result.secure_url); // Resolve with the public URL of the file
            }
        });
    });
};

module.exports = { uploadToCloudinary };

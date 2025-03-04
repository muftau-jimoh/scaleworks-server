
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
        // Cloudinary Upload Options
        const options = {
            resource_type: "raw",  // Supports non-image files like PDFs, DOCX, XLSX
            access_mode: "public",
            folder: folder,
        };

        // If the file is stored on disk (has a path)
        if (file.path) {
            cloudinary.uploader.upload(file.path, options, (error, result) => {
                // Delete local file after upload attempt
                fs.unlink(file.path, (err) => {
                    if (err) console.error(`Error deleting file ${file.path}:`, err);
                });

                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            });

        // If the file is an in-memory buffer (e.g., multer)
        } else if (file.buffer) {
            const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            });

            streamifier.createReadStream(file.buffer).pipe(stream);
        } else {
            reject(new Error("Invalid file input: Must have either 'path' or 'buffer'"));
        }
    });
};


module.exports = { uploadToCloudinary };
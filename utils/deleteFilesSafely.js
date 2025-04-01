const fs = require("fs-extra");

/**
 * Deletes multiple files safely by checking if they exist first.
 * @param {Array} files - List of file objects containing `path` property.
 */
const deleteFilesSafely = async (files) => {
    if (!Array.isArray(files) || files.length === 0) return;

    await Promise.allSettled(
        files.map(async (file) => {
            try {
                // Check if the file exists before deleting
                await fs.access(file.path);
                await fs.unlink(file.path);
                console.log(`🗑️ Deleted: ${file.path}`);
            } catch (err) {
                if (err.code === "ENOENT") {
                    console.log(`⚠️ File not found: ${file.path}`);
                } else {
                    console.error(`❌ Error deleting ${file.path}:`, err);
                }
            }
        })
    );
};

module.exports = { deleteFilesSafely }
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");

/**
 * Extracts text from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} - Extracted text.
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
}

/**
 * Extract text from multiple PDFs in parallel.
 * @param {string} folderPath - Folder containing PDFs.
 * @returns {Promise<object[]>} - Array of { fileName, text }.
 */
async function extractTextFromPDFs(folderPath) {
    const pdfFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".pdf"));

    const extractionPromises = pdfFiles.map(async (file) => {
        const text = await extractTextFromPDF(path.join(folderPath, file));
        return { fileName: file, text };
    });

    return await Promise.all(extractionPromises);
}

module.exports = extractTextFromPDFs;

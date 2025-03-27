const fs = require("fs").promises; // Use async fs methods
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const csvParser = require("csv-parser");
const xlsx = require("xlsx");
const { JSDOM } = require("jsdom"); // Helps strip HTML from markdown
const { Readable } = require("stream");

async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === ".pdf") {
    const buffer = await fs.readFile(file.path);
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const buffer = await fs.readFile(file.path);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === ".csv") {
    return new Promise((resolve, reject) => {
      const results = [];
      Readable.from(fs.readFile(file.path))
        .pipe(csvParser())
        .on("data", (row) => results.push(Object.values(row).join(" ")))
        .on("end", () => resolve(results.join("\n")))
        .on("error", reject);
    });
  }

  if (ext === ".xlsx") {
    const workbook = xlsx.readFile(file.path);
    let text = "";
    workbook.SheetNames.forEach((sheetName) => {
      text += xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]) + "\n";
    });
    return text;
  }

  if (ext === ".md") {
    const content = await fs.readFile(file.path, "utf-8");
    const dom = new JSDOM(content);
    return dom.window.document.body.textContent || "";
  }

  if (ext === ".txt") {
    return await fs.readFile(file.path, "utf-8");
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Extracts text from multiple files asynchronously.
 */
async function extractTextFromFiles(files) {
  return Promise.all(
    files.map(async (file) => {
      try {
        const text = await extractTextFromFile(file);
        return { status: "success", text };
      } catch (error) {
        console.error(`Error extracting text from ${file.originalname}:`, error.message);
        return { status: "failed", error: error.message };
      }
    })
  );
}

module.exports = { extractTextFromFiles, extractTextFromFile };

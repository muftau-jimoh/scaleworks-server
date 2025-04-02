const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  callDocumentAutomationService,
  generateExcel,
} = require("../services/documentService"); // Function to fill the template
const { uploadToCloudinary } = require("../utils/fileUpload");

exports.automateDocument = async (req, res) => {
  let file;

  try {
    const userId = req.user?.id;
    file = req.file; // Get uploaded file,

    if (!file) {
      return res.status(400).json({ error: "Your PDF Form is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Auth user is required" });
    }

    const filePath = path.join(__dirname, "../uploads/file", file.filename);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: `File not found: ${file.filename}` });
    }
    

    // ✅ Step 1: Upload to Cloudinary
    const folder = `scaleworks/${userId}/documentAutomation/pdfs`;
    const documentUrl = await uploadToCloudinary(file, folder);

    if (!documentUrl) {
      return res.status(500).json({ error: "File upload failed" });
    }

    // ✅ Step 2 Call Stack AI Document Automation service with the file URL
    let extractedData = await callDocumentAutomationService(
      documentUrl,
      userId
    );

    if (!extractedData) {
      return res
        .status(500)
        .json({ error: "Error extracting text from document" });
    }

    // ✅ Step 3: Copy Excel template
    const EXCEL_TEMPLATE_PATH = path.join(
      __dirname,
      "../assets/template/schedule_template.xlsx"
    );

    const GENERATED_EXCEL_PATH = path.join(__dirname, `../assets/generated/`);
    if (!fs.existsSync(GENERATED_EXCEL_PATH)) {
      fs.mkdirSync(GENERATED_EXCEL_PATH, { recursive: true }); // Create user folder if it doesn't exist
    }

    // Create a unique copy for the request
    const newFileName = `schedule_${uuidv4()}-${userId}.xlsx`;
    const newFilePath = path.join(GENERATED_EXCEL_PATH, newFileName);
    fs.copyFileSync(EXCEL_TEMPLATE_PATH, newFilePath);

    // ✅ Step 4: Populate Excel with extracted data
    const responseMessage = await generateExcel(newFilePath, extractedData);

    if (responseMessage?.error) {
      return res.status(500).json({ error: "Error generating Excel Sheet" });
    }

    // ✅ Step 5: Upload Excel to Cloudinary
    const excelFolder = `scaleworks/${userId}/documentAutomation/excels`;
    const excelUrl = await uploadToCloudinary(
      { path: newFilePath },
      excelFolder
    );

    // ✅ Step 6: Send response
    res.status(200).json({ excelURL: excelUrl });
  } catch (error) {
    console.error("Error processing document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// USING GOOGLE OCR
// exports.automateDocument = async (req, res) => {
//   let file;

//   try {
//     const userId = req.user?.id;
//     file = req.file; // Get uploaded file,

//     if (!file) {
//       return res.status(400).json({ error: "Your PDF Form is required" });
//     }

//     // ✅ Step 1: Upload to Cloudinary
//     // const folder = `scaleworks/${userId}/documentAutomation/pdfs`;
//     // const documentUrl = await uploadToCloudinary(file, folder);

//     // if (!documentUrl) {
//     //   return res.status(500).json({ error: "File upload failed" });
//     // }

//     const filePath = file.path; // This is the local path

//     // ✅ Step 2: Extract text using Google OCR
//     const extractedText = await extractTextFromPDF(filePath);
//     if (!extractedText) {
//       return res.status(500).json({ error: "Text extraction failed" });
//     }

//     console.log('extractedText: ', extractedText)

//     return res.status(400).json({ error: "Your PDF Form is required" });

//     // ✅ Step 3: Analyze text with GPT-4
//     const EXCEL_TEMPLATE_PATH = path.join(
//       __dirname,
//       "../assets/template/schedule_template.xlsx"
//     );
//     const excelTemplateStructure = await getExcelTemplateStructure(EXCEL_TEMPLATE_PATH);

//     console.log('excelTemplateStructure: ', excelTemplateStructure)

//     const extractedData = await analyzeExtractedText(extractedText, excelTemplateStructure);
//     if (!extractedData) {
//       return res.status(500).json({ error: "AI analysis failed" });
//     }
//     console.log('extractedData: ', extractedData)

//     // ✅ Step 4: Copy Excel template
//     const GENERATED_EXCEL_PATH = path.join(__dirname, `../assets/generated/`);
//     if (!fs.existsSync(GENERATED_EXCEL_PATH)) {
//       fs.mkdirSync(GENERATED_EXCEL_PATH, { recursive: true }); // Create user folder if it doesn't exist
//     }

//     // Create a unique copy for the request
//     const newFileName = `schedule_${uuidv4()}-${userId}.xlsx`;
//     const newFilePath = path.join(GENERATED_EXCEL_PATH, newFileName);
//     fs.copyFileSync(EXCEL_TEMPLATE_PATH, newFilePath);

//     // ✅ Step 5: Populate Excel with extracted data
//     const responseMessage = await generateExcel(newFilePath, extractedData);

//     if (responseMessage?.error) {
//       return res.status(500).json({ error: "Error generating Excel Sheet" });
//     }

//     // ✅ Step 6: Upload Excel to Cloudinary
//     const excelFolder = `scaleworks/${userId}/documentAutomation/excels`;
//     const excelUrl = await uploadToCloudinary(
//       { path: newFilePath },
//       excelFolder
//     );

//     // ✅ Step 7: Send response
//     res.status(200).json({ excelURL: excelUrl });
//   } catch (error) {
//     console.error("Error processing document:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   } finally {
//     if (file) {
//       await unlinkAsync(file.path);
//       console.log("file deleted successfully.");
//     }
//   }
// };

const axios = require("axios");
const { extractJSON } = require("../utils/JSONFromString");
const ExcelJS = require("exceljs");
const { cellPosition } = require("../utils/DSConstants");

require("dotenv").config();

const MY_STACK_AI_API_TOKEN_TWO = process.env.MY_STACK_AI_API_TOKEN_TWO;

const in_0 = `here's the json response structure to follow:

{"Page 1": { "Name": "", "Docket No.": "", "GROSS MONTHLY RECEIPTS": "", "Cost of goods sold": "", "Advertising": "", "Bad Debts": "", "Motor Vehicles": "", "Gas": "", "Insurance": "", "Maintenance": "", "Registration": "", "Commissions": "", "Depletion": "", "Dues and Publications": "", "Employee Benefit Programs": "", "Freight": "", "Insurance one key": "", "Insurance one value": "", "Insurance two key": "", "Insurance two value": "", "Interest on mortgage to banks": "", "Interest on loans": "", "Legal and Professional services": "", "Office expenses": "", "Laundry and cleaning": "", "Pension and profit sharing": "", "Rent on leased equipment": "", "Machinery/Equipment": "", "Other business property": "", "Repairs": "", "Supplies": "", "Taxes": "", "Travel": "", "Meals and entertainment": "", "Utilities and phones": "", "Wages": "", "Other expenses one key": "", "Other expenses one value": "", "Other expenses two key": "", "Other expenses two value": "" }, "Page 2": { "TOTAL MONTHLY EXPENSES": "", "WEEKLY BUSINESS INCOME": "", "Seasonal Business": "", "Monthly Income Percentage": [ { "Month": "January", "Percentage Income": "", "expenses": "" }, { "Month": "February", "Percentage Income": "", "expenses": "" }, { "Month": "March", "Percentage Income": "", "expenses": "" }, { "Month": "April", "Percentage Income": "", "expenses": "" }, { "Month": "May", "Percentage Income": "", "expenses": "" }, { "Month": "June", "Percentage Income": "", "expenses": "" }, { "Month": "July", "Percentage Income": "", "expenses": "" }, { "Month": "August", "Percentage Income": "", "expenses": "" }, { "Month": "September", "Percentage Income": "", "expenses": "" }, { "Month": "October", "Percentage Income": "", "expenses": "" }, { "Month": "November", "Percentage Income": "", "expenses": "" }, { "Month": "December", "Percentage Income": "", "expenses": "" } ], "Business Accounts Basis": "", "Fiscal Year Start": "", "Fiscal Year End": "", "Gross Receipts Year to Date": "", "Gross Expenses Year to Date": "" } }

`;

const documentAutomationURL =
  "https://api.stack-ai.com/inference/v0/run/b3ea6100-6e2a-40c6-97f2-aa9f3c066f37/67b68780ed1f0ac8273d3eeb";


exports.callDocumentAutomationService = async (documentUrl, userId) => {
  const data = {
    "in-0": in_0,
    user_id: `${userId}`,
    "doc-0": [documentUrl],
  };

  try {
    const response = await axios.post(documentAutomationURL, data, {
      headers: {
        "Authorization": `Bearer ${MY_STACK_AI_API_TOKEN_TWO}`,
        "Content-Type": "application/json",
      },
    });

    const stringedJSON = response.data.outputs["out-0"];

    const parsedResponse = extractJSON(stringedJSON);
    return parsedResponse;
  } catch (error) {
    console.error("Document automation service failed:", error);
    throw error; // Rethrow for handling in calling function
  }
};


exports.generateExcel = async (filePath, extractedData) => {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.readFile(filePath);

    // Iterate over each sheet and update values
    for (const sheetName of Object.keys(extractedData)) {
      const sheet = workbook.getWorksheet(sheetName);
      if (!sheet) {
        console.error(`Sheet "${sheetName}" not found.`);
        continue;
      }

      const data = extractedData[sheetName];
      const positions = cellPosition[sheetName];

      for (const key of Object.keys(data)) {
        if (key === "Monthly Income Percentage") {
          // Handle Monthly Income Percentage separately as it's an array
          data[key].forEach((entry, index) => {
            const monthPosition = positions["Monthly Income Percentage"][index];
            sheet.getCell(monthPosition["Percentage Income"]).value =
              entry["Percentage Income"];
            sheet.getCell(monthPosition["expenses"]).value = entry["expenses"];
          });
        } else if (positions[key]) {
          // Update normal values
          sheet.getCell(positions[key]).value = data[key];
        }
      }
    }

    // Save the updated file
    await workbook.xlsx.writeFile(filePath);
    return { success: "Excel Sheet generated succesfully." };
  } catch (error) {
    return { error: "Error generating Excel Sheet." };
  }
};



// USING GOOGLE OCR


// exports.getExcelTemplateStructure = async (filePath) => {
//   const workbook = new ExcelJS.Workbook();
//   await workbook.xlsx.readFile(filePath);

//   let structure = {};
  
//   workbook.eachSheet((sheet) => {
//     let sheetData = {};
//     sheet.eachRow((row, rowNumber) => {
//       row.eachCell((cell, colNumber) => {
//         const cellValue = cell.value?.toString().trim();
//         if (cellValue) {
//           sheetData[cellValue] = "";
//         }
//       });
//     });
//     structure[sheet.name] = sheetData;
//   });

//   return structure;
// };




// Initialize Google Cloud Vision client
// const client = new vision.ImageAnnotatorClient();

// exports.extractTextFromPDF = async (pdfUrl) => {
//   try {
//     const [result] = await client.documentTextDetection(pdfUrl);
//     const fullText = result.fullTextAnnotation?.text || "";
//     return fullText;
//   } catch (error) {
//     console.error("Google OCR Error:", error);
//     throw new Error("Error extracting text from document.");
//   }
// };



// exports.extractTextFromPDF = async (pdfFilePath) => {
//   try {
//     const authClient = await getGoogleAuthClient();

//     // Initialize Google Cloud Vision client with Workload Identity auth
//     const client = new vision.ImageAnnotatorClient({ auth: authClient });

//     // Read the PDF and convert to Base64
//     const pdfBuffer = fs.readFileSync(pdfFilePath);
//     const pdfBase64 = pdfBuffer.toString('base64');

    
//     console.log('client: ', client)

//     // Perform OCR using asyncBatchAnnotateFiles (for PDFs with images)
//     const [operation] = await client.asyncBatchAnnotateFiles({
//       requests: [
//         {
//           inputConfig: {
//             mimeType: 'application/pdf',  // ✅ Must be PDF
//             content: pdfBase64,  // ✅ Convert PDF to Base64
//           },
//           features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],  // ✅ Extract text from images
//         },
//       ],
//     });

    
//     console.log('operation: ', operation)
//     console.log("OCR Processing started. Waiting for results...");
//     const [response] = await operation.promise(); // Wait for OCR to complete

//     console.log('response: ', response)

//     // ✅ Extract all text from the response
//     const fullText = response.responses
//       .map(res => res.fullTextAnnotation?.text || "")
//       .join("\n");

//     return fullText;  // Return extracted text
//   } catch (error) {
//     console.error("Google OCR Error:", error);
//     throw new Error("Error extracting text from document.");
//   }
// };

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  callDocumentAutomationService,
  generateExcel,
} = require("../services/documentService"); // Function to fill the template
const { uploadToCloudinary } = require("../utils/fileUpload");

const extractedData = {
  "Page 1": {
    Name: "Muftaudeen Jimoh",
    "Docket No.": "0123456",
    "GROSS MONTHLY RECEIPTS": "234,567.00",
    "Cost of goods sold": "345.00",
    Advertising: "345.00",
    "Bad Debts": "345.00",
    "Motor Vehicles": "0.00",
    Gas: "0.00",
    Insurance: "345.00",
    Maintenance: "345.00",
    Registration: "345.00",
    Commissions: "345.00",
    Depletion: "0.00",
    "Dues and Publications": "0.00",
    "Employee Benefit Programs": "0.00",
    Freight: "0.00",
    "Insurance one key": "life insurance",
    "Insurance one value": "350",
    "Insurance two key": "med insurance",
    "Insurance two value": "350",
    "Interest on mortgage to banks": "345.00",
    "Interest on loans": "345.00",
    "Legal and Professional services": "345.00",
    "Office expenses": "0.00",
    "Laundry and cleaning": "0.00",
    "Pension and profit sharing": "0.00",
    "Rent on leased equipment": "0.00",
    "Machinery/Equipment": "0.00",
    "Other business property": "567,876",
    Repairs: "0.00",
    Supplies: "567,876",
    Taxes: "0.00",
    Travel: "567,876",
    "Meals and entertainment": "0.00",
    "Utilities and phones": "567,876",
    Wages: "0.00",
    "Other expenses one key": "laundry",
    "Other expenses one value": "34",
    "Other expenses two key": "netflix & chill",
    "Other expenses two value": "30",
  },
  "Page 2": {
    "TOTAL MONTHLY EXPENSES": "123,567.00",
    "WEEKLY BUSINESS INCOME": "320,000",
    "Seasonal Business": "Yes",
    "Monthly Income Percentage": [
      {
        Month: "January",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "February",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "March",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "April",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "May",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "June",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "July",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "August",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "September",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "October",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "November",
        "Percentage Income": "20",
        expenses: "2,344",
      },
      {
        Month: "December",
        "Percentage Income": "20",
        expenses: "2,344",
      },
    ],
    "Business Accounts Basis": "CALENDAR",
    "Fiscal Year Start": "February 1, 2024",
    "Fiscal Year End": "January 31, 2025",
    "Gross Receipts Year to Date": "567,899.00",
    "Gross Expenses Year to Date": "567,899.00",
  },
};

exports.automateDocument = async (req, res) => {
  try {
    const userId = req.user?.id;
    const file = req.file; // Get uploaded file,

    if (!file) {
      return res.status(400).json({ error: "Your PDF Form is required" });
    }

    // Upload file concurrently to Cloudinary
    const folder = `scaleworks/${userId}/documentAutomation/pdfs`;
    const documentUrl = await uploadToCloudinary(file, folder);

    if (!documentUrl) {
      return res.status(500).json({ error: "File upload failed" });
    }

    // Call Stack AI Document Automation service with the file URL
    let extractedData = await callDocumentAutomationService(
      documentUrl,
      userId
    );

    if (!extractedData) {
      return res
        .status(500)
        .json({ error: "Error extracting text from document" });
    }

    // Paths
    const templatePath = path.join(
      __dirname,
      "../assets/template/schedule_template.xlsx"
    );
    const userFolder = path.join(__dirname, `../assets/generated/`);

    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true }); // Create user folder if it doesn't exist
    }

    // Create a unique copy for the request
    const newFileName = `schedule_${uuidv4()}-${userId}.xlsx`;
    const newFilePath = path.join(userFolder, newFileName);
    fs.copyFileSync(templatePath, newFilePath);

    // Generate an Excel file with extracted data
    const responseMessage = await generateExcel(newFilePath, extractedData);

    if (responseMessage?.error) {
      return res.status(500).json({ error: "Error generating Excel Sheet" });
    }

    // Upload generated excel to Cloudinary
    const excelFolder = `scaleworks/${userId}/documentAutomation/excels`;
    const excelUrl = await uploadToCloudinary(
      { path: newFilePath },
      excelFolder
    );

    // Send the file to the client
    res.status(200).json({ excelURL: excelUrl });
  } catch (error) {
    console.error("Error processing document:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

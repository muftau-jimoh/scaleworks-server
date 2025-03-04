const XLSX = require("xlsx-style");
const axios = require("axios");
const ExcelJS = require("exceljs");
const { extractJSON } = require("../utils/JSONFromString");
const { cellPosition } = require("../utils/DSConstants");

require("dotenv").config();

const STACK_AI_API_TOKEN_TWO = process.env.STACK_AI_API_TOKEN_TWO;

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
        Authorization: `Bearer ${STACK_AI_API_TOKEN_TWO}`,
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

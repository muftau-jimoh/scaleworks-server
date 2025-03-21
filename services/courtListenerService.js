const axios = require("axios");
const { stringify, parse } = require("flatted");
const chalk = require("chalk");
const { findRelevantCases } = require("./nlpCaseSummary");

const COURTLISTENER_API_URL =
  "https://www.courtlistener.com/api/rest/v3/opinions/";
const COURTLISTENER_API_TOKEN = process.env.COURTLISTENER_API_TOKEN;

/**
 * Fetches relevant case law from CourtListener API.
 * @param {string} query - Legal question to search for.
 * @returns {Promise<Array>} - Array of case law objects.
 */
exports.getCourtListenerCases = async (query) => {
  try {
    const response = await axios.get(COURTLISTENER_API_URL, {
      params: { search: query, full_case: false, page: 1, page_size: 3 },
      headers: {
        Authorization: `Token ${COURTLISTENER_API_TOKEN}`,
      },
    });

    const result = response.data?.results;

    let limitedArr = result[0];
    if (limitedArr["plain_text"]) {
      limitedArr = limitedArr["plain_text"];
    } else if (limitedArr["html"]) {
      limitedArr = limitedArr["html"];
    }

    if (!limitedArr[0]) return "";
    // const summaryReport = await findRelevantCases(query, limitedArr)

    console.log("limitedArr: ", limitedArr);
    // const formattedResponse = JSON.stringify(JSON.parse(stringify(response.data)), null, 2);
    // console.log(chalk.green.bold('Response:\n') + chalk.yellow(formattedResponse));

    return result.map((c) => ({
      name: c.caseName || "Unknown Case",
      court: c.court?.name || "Unknown Court",
      decisionDate: c.date_filed || "N/A",
      summary: c.opinion || "No summary available",
      citation: c.citation || "N/A",
      link: c.absolute_url
        ? `https://www.courtlistener.com${c.absolute_url}`
        : "N/A",
    }));
  } catch (error) {
    console.error("CourtListener API Error:", error);
    return [];
  }
};

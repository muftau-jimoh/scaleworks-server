const axios = require("axios");
require("dotenv").config();

async function getOIDCToken() {
  try {
    const response = await axios.post(
      `${process.env.AUTH0_ISSUER}/oauth/token`,
      {
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: process.env.AUTH0_AUDIENCE,
        grant_type: "client_credentials",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching OIDC token:", error.response?.data || error);
    throw new Error("Failed to get OIDC token.");
  }
}

module.exports = { getOIDCToken };

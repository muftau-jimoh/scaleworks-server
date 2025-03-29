const { GoogleAuth } = require("google-auth-library");

async function getAuthClient() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return await auth.getClient();
}

module.exports = { getAuthClient };

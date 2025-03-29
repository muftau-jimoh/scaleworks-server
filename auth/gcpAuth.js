const { GoogleAuth } = require("google-auth-library");
const { getOIDCToken } = require("./auth0");
const path = require("path");
const fs = require("fs");

async function getGoogleAuthClient() {
//   const oidcToken = await getOIDCToken();
  const oidcToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlN1X1gzOGRndm16aTFneDd6UlI3bSJ9.eyJpc3MiOiJodHRwczovL2Rldi00N2Y4a3VpcDN3OGJlcWg1LnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhRVBreTBjaEJNREtGSTVndlE1Y3dnTElxNXVmcFBMbkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9pYW0uZ29vZ2xlYXBpcy5jb20vcHJvamVjdHMvMjMzNzgwODAyMzkzL2xvY2F0aW9ucy9nbG9iYWwvd29ya2xvYWRJZGVudGl0eVBvb2xzL3NjYWxld29ya3MvcHJvdmlkZXJzL2F1dGgwLXByb3ZpZGVyIiwiaWF0IjoxNzQzMjU0MDc2LCJleHAiOjE3NDMzNDA0NzYsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsImF6cCI6ImFFUGt5MGNoQk1ES0ZJNWd2UTVjd2dMSXE1dWZwUExuIn0.ERftsGRveiBXfFtzwZtImDAXXrRi-4DeQQO2PJQSSaGDfAuQwMO7JleVBf1PUymW65Fg9LBHK0HN0JzrrrtYmbouKVyA_jiBwQAk0PS6AftczhchLvAzFX5UGZ6gukUgRqfoKZZXDBLZb1Ii-BClBa3dFXiN3kgjmDyJ0Ta7FcVrO6g_fIkizkeIxBRHBYwEbBZ1SiE4rAdNS0QzOuN7Kv8fiT3ui3dOArzBIQC8CuAWdY5TeIjDM13-GSFVIC52xIB0V2G4k6-8Z6gPda4hjFqQJ0IYk0bLrhojylV2nhK-bMXSdCXNUj7Jk5ybzJVgFcrhpxUXXxpMXctgjEccEw';

// console.log('oidcToken: ', oidcToken)
  // Step 1: Write the token to a temporary JSON file
  const tempDir = path.join(__dirname, "/tempTokenFile");
  const tempFilePath = path.join(tempDir, "oidc-token.json");

  try {
    
    // Ensure the directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true }); // ✅ Create directory if missing
      }

    // Write token to temporary file
    fs.writeFileSync(tempFilePath, JSON.stringify({ token: oidcToken }));


    if (!fs.existsSync(tempFilePath)) {
        throw new Error(`OIDC token file not found at ${tempFilePath}`);
      }
    
    // Authenticate using the temporary file
    const auth = new GoogleAuth({
      credentials: {
        type: "external_account",
        audience: `https://iam.googleapis.com/projects/${process.env.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${process.env.WIF_POOL_ID}/providers/${process.env.WIF_PROVIDER_ID}`,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
        token_url: "https://sts.googleapis.com/v1/token",
        credential_source: { file: tempFilePath },  // ✅ Use file as credential source
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    
    return client;
  } finally {
    // Cleanup: Delete the temporary file
    fs.unlink(tempFilePath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });
  }
}
module.exports = { getGoogleAuthClient };


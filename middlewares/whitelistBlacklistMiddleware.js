const supabase = require("../config/supabaseClient");

// DO NOT CHANGE
const TABLE_NAME = "email_access_list"; // replace with your actual table
const RECORD_ID = 1;   // or however you identify the single record

// List of hardcoded allowed emails (bypass all checks)
const ALWAYS_ALLOWED_EMAILS = [
  "closerinsights.suggestions@gmail.com",
  // add more emails here
];

async function whitelistBlacklistMiddleware(req, res, next) {
  try {
    const { email } = req.body; // Assuming you send this in the login request

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase();

    // If email is in the hardcoded always-allowed list, allow immediately
    if (ALWAYS_ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
      return next();
    }

    // Fetch whitelist and blacklist from Supabase
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, whitelisted, blacklisted')
      .eq('id', RECORD_ID)
      .single();

    if (error) {
      console.error("Error fetching whitelist/blacklist:", error);
      return res.status(500).json({ error: "Internal server error. Please try again later." });
    }

    let { whitelisted = [], blacklisted = [] } = data;

    // Normalize Supabase lists
    const normalizedWhitelist = whitelisted.map(item => item.toLowerCase());
    const normalizedBlacklist = blacklisted.map(item => item.toLowerCase());

    // Block if blacklisted
    if (normalizedBlacklist.includes(normalizedEmail)) {
      return res.status(403).json({ error: "Access denied. You are blacklisted." });
    }

    // Block if not whitelisted
    if (!normalizedWhitelist.includes(normalizedEmail)) {
      return res.status(403).json({ error: "Access denied. You are not whitelisted." });
    }

    // All checks passed
    next();
    
  } catch (err) {
    console.error("Middleware error:", err);
    return res.status(500).json({ error: "Internal server error. Please try again later." });
  }
}

module.exports = { whitelistBlacklistMiddleware };

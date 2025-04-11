const supabase = require("../config/supabaseClient");


// DO NOT CHANGE
const TABLE_NAME = "email_access_list"; // replace with your actual table
const RECORD_ID = 1;   // or however you identify the single record


// exports.createWhitelistBlacklistRecord = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from(TABLE_NAME)
//       .insert([
//         {
//           whitelisted: [],
//           blacklisted: [],
//         }
//       ])
//       .single(); // ensure it returns the inserted single row

//     if (error) throw error;

//     return res.status(201).json({ message: "Record created successfully.", data });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ error: "Failed to create record.", details: err.message });
//   }
// };

exports.updateWhitelistedEmailList = async (req, res) => {
  const { emails } = req.body; // expect emails to be an array

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Invalid emails array." });
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, whitelisted, blacklisted')
      .eq('id', RECORD_ID)
      .single();

    if (error) throw error;

    let { whitelisted = [], blacklisted = [] } = data;

    // Remove from blacklist
    blacklisted = blacklisted.filter(email => !emails.includes(email));

    // Add to whitelist, ensuring no duplicates
    whitelisted = Array.from(new Set([...whitelisted, ...emails]));

    // Update the record
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({ whitelisted, blacklisted })
      .eq('id', RECORD_ID);

    if (updateError) throw updateError;

    return res.status(200).json({ message: "Emails successfully whitelisted.", whitelisted, blacklisted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

exports.updateBlacklistedEmailList = async (req, res) => {
  const { emails } = req.body; // expect emails to be an array

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Invalid emails array." });
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('id, whitelisted, blacklisted')
      .eq('id', RECORD_ID)
      .single();

    if (error) throw error;

    let { whitelisted = [], blacklisted = [] } = data;

    // Remove from whitelist
    whitelisted = whitelisted.filter(email => !emails.includes(email));

    // Add to blacklist, ensuring no duplicates
    blacklisted = Array.from(new Set([...blacklisted, ...emails]));

    // Update the record
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({ whitelisted, blacklisted })
      .eq('id', RECORD_ID);

    if (updateError) throw updateError;

    return res.status(200).json({ message: "Emails successfully blacklisted.", whitelisted, blacklisted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};

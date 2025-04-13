const supabase = require("../config/supabaseClient")
const { uploadToCloudinary } = require("../utils/fileUpload");
const { deleteFilesSafely } = require("../utils/deleteFilesSafely");


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

    return res.status(200).json({ message: "Emails successfully whitelisted." });
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

    return res.status(200).json({ message: "Emails successfully blacklisted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
};


exports.getEmailLists = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME) 
      .select("*")
      .single(); 

    if (error) {
      console.error("Error fetching email lists:", error);
      return res.status(500).json({ error: "Failed to fetch email lists." });
    }

    return res.status(200).json({ 
      whitelisted: data.whitelisted,
      blacklisted: data.blacklisted
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};




exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the 'profile' table
    const { data, error } = await supabase
      .from('profiles') // Make sure the table name is correct
      .select('*'); // Select all columns

    if (error) {
      // If there's an error, return it
      return res.status(500).json({ error: error.message });
    }

    // Return the data to the client
    return res.status(200).json(data);
  } catch (err) {
    // Handle any other unexpected errors
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while fetching users.' });
  }
};


exports.uploadUsersLogo = async (req, res) => {
  try {
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    const uploadedLogoUrls = {};

    // Loop over each uploaded file
    for (const file of req.files) {
      const companyID = file.fieldname; // 👈 The company name

      // Upload the file to Cloudinary (or wherever you want)
      const folder = 'scaleworks/company_logos';
      let logoUrl;

      try {
        logoUrl = await uploadToCloudinary(file, folder);
      } catch (error) {
        console.log(`Error uploading logo for company ${companyID}: `, error)
        continue
      }
      

      // Save the Cloudinary URL mapped to the company name
      uploadedLogoUrls[companyID] = logoUrl;

      // Fetch the user from Supabase by company_name
      const { data: user, error: fetchError } = await supabase
        .from('profiles') // Your table
        .select('*')
        .eq('id', companyID)
        .single();

      if (fetchError) {
        console.error(`Error fetching user for company ${companyID}:`, fetchError.message);
        continue; // Skip to the next company
      }

      // Update user's logo_url in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: logoUrl })
        .eq('id', companyID);

      if (updateError) {
        console.error(`Error updating logo for company ${companyID}:`, updateError.message);
      }
    }

    // All done
    return res.status(200).json({
      message: 'Company logos uploaded successfully.',
      uploadedLogoUrls,
    });

  } catch (err) {
    console.error('Error in uploadUsersLogo controller:', err);

    return res.status(500).json({
      error: 'An error occurred while processing the files and updating users.',
    });
  }
};

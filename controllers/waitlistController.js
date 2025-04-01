const supabase = require("../config/supabaseClient");

require("dotenv").config();

const { Resend } = require("resend"); // ✅ Correct way to import in CommonJS
const resend = new Resend(process.env.RESEND_API_KEY);

exports.addToWaitlist = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if the email already exists in the waitlist table
    const { data: existingUser, error: fetchError } = await supabase
      .from("waitlist")
      .select("email")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // Ignore "No rows found" error (PGRST116), as it means the email isn't in the database
      // console.error("❌ Supabase Fetch Error:", fetchError);
      return res.status(500).json({ error: "Database error" });
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email already registered to waitlist" });
    }

    // Insert the new email into the waitlist table
    const { data, error: insertError } = await supabase
      .from("waitlist")
      .insert({ email });

    if (insertError) {
      // console.error("❌ Supabase Insert Error:", insertError);
      return res.status(500).json({ error: "Failed to register for waitlist" });
    }

    // Send confirmation email
    await resend.emails.send({
      from: "team@scaleworks.ai",
      to: email,
      subject: "Waitlist Confirmation",
      html: `<p>Thank you for joining our waitlist! 🎉</p>
               <p>We'll notify you when we launch.</p>
               <p>Stay tuned!</p>`,
    });

    return res
      .status(200)
      .json({ message: "Successfully registered for waitlist" });
  } catch (error) {
    console.error("❌ Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const supabase = require("../config/supabaseClient");

require("dotenv").config();

const { getUserByAuthId, validateForm } = require("../utils/getUserByAuthId");


// User Signup
exports.signup = async (req, res) => {
    const { organization_name, email, user_name, password } = req.body;

    const validationError = validateForm({ organization_name, email, user_name, password })
    
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        // Check if email already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from("profiles")
            .select("email")
            .eq("email", email)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") { 
            // PGRST116: No rows found (safe to ignore)
            return res.status(500).json({ error: "Error checking email existence. Try again later." });
        }

        if (existingUser) {
            return res.status(400).json({ error: "Email already in use. Please log in or use a different email." });
        }

        // Create Auth-User
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data?.user) {
            // Create user profile
            const { error: profileError } = await supabase.from("profiles").insert({
                auth_id: data.user.id,
                user_name: user_name,
                email: data.user.email,
                organization_name
            });

            if (profileError) {
                return res.status(500).json({ error: profileError });
            }
        }

        return res.status(201).json({ message: "Signup successful. Please verify your email." });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};



// User Login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Save the access_token in a secure HTTP-only cookie
    res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: data.session.expires_in * 10000, // Set cookie expiration time
    });

    
    let user = await getUserByAuthId(data?.user?.id)

    return res.status(200).json({ message: 'Login successful.', user });
};


// User Logout
exports.logout = async (req, res) => {
    try {
        // Get the access token from cookies
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(400).json({ error: "No active session found." });
        }

        // Call Supabase signOut to invalidate the token
        await supabase.auth.signOut();

        // Clear the cookie
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(200).json({ message: "Logout successful." });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Internal server error.", error: err });
    }
};


// Password Reset Request
exports.resetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.RESET_PASS_REDIRECT_URL}`,
      })
      

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Password reset email sent.' });
};


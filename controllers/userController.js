const supabase = require("../config/supabaseClient");

const { getUserByAuthId } = require("../utils/getUserByAuthId");


// User Signup
exports.signup = async (req, res) => {
    const { email, user_name, password } = req.body;

    if (!email || !user_name || !password) {
        return res.status(400).json({ error: "Email, user name, and password are required." });
    }


    try {
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
            });

            if (profileError) {
                return res.status(500).json({ message: "Failed to create user profile - Try again later", error: profileError });
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
        const { error } = await supabase.auth.signOut();

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

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Password reset email sent.' });
};


// Update Reset
exports.updatePassword = async (req, res) => {
    const { new_password } = req.body;

    if (!new_password) {
        return res.status(400).json({ error: 'Your new password is required.' });
    }

    const { data, error } = await supabase.auth.updateUser({ password: new_password })


    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ message: 'Password successfully reset.', data });
};

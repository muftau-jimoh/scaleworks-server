const supabase = require('../config/supabaseClient');
const { getUserByAuthId } = require('../utils/getUserByAuthId');

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token;

        if (!token) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Access denied. No token provided.' });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired token.' });
        }

        req.user = await getUserByAuthId(data?.user?.id);
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error.' });
    }
};

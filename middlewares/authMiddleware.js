const supabase = require("../config/supabaseClient");
const { getUserByAuthId } = require("../utils/getUserByAuthId");

exports.isAuthenticatedUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    req.user = await getUserByAuthId(data?.user?.id);

    next();
  } catch (err) {
    // console.error('Authentication error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


exports.isAuthenticatedAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const user = await getUserByAuthId(data?.user?.id);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    if (user.user_name !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

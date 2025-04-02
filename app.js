const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const multer = require("multer");
const userRoutes = require('./routes/userRoutes.js');
const legalResearchRoutes = require("./routes/legalResearchRoutes.js");
const eDiscoveryRoutes = require("./routes/eDiscoveryRoutes.js");
const contractReviewRoutes = require("./routes/contractReviewRoutes.js");
const transcriptionRoutes = require("./routes/transcriptionRoutes.js");
const chatbotRoutes = require("./routes/chatbotRoutes.js");
const documentAutomationRoutes = require("./routes/documentAutomationRoutes.js");
const waitlistRoutes = require("./routes/waitlistRoutes.js");


const cookieParser = require('cookie-parser');

const app = express();


dotenv.config(); // Load environment variables


// Middleware
const allowedOrigins = [
    "http://localhost:3000",
    "https://scalesworks.vercel.app",
    "https://scaleworks.ai"
];

app.use(
    cors({
      origin: ["http://localhost:3000", "https://scalesworks.vercel.app", "https://scaleworks.ai"], // Restrict to known origins
      credentials: true, // Allow cookies & authentication
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Content-Length",
        "X-Requested-With",
      ],
    })
  );
  

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
  
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.options("*", cors()); // Handle preflight requests



const upload = multer(); // This ensures multer is initialized

// Routes
app.use('/api/user', userRoutes);

app.use("/api/legal-research", legalResearchRoutes);
app.use("/api/ediscovery", eDiscoveryRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/contract-review", contractReviewRoutes);
app.use("/api/document-automation", documentAutomationRoutes);

// landing page routes
app.use("/api/waitlist", waitlistRoutes);


// trainNlpModel();

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to ScalesWorks API!' });
});

module.exports = app;

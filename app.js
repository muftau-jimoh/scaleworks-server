const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes.js');
const legalResearchRoutes = require("./routes/legalResearchRoutes.js");
const eDiscoveryRoutes = require("./routes/eDiscoveryRoutes.js");
const contractReviewRoutes = require("./routes/contractReviewRoutes.js");
const transcriptionRoutes = require("./routes/transcriptionRoutes.js");
const chatbotRoutes = require("./routes/chatbotRoutes.js");
const documentAutomationRoutes = require("./routes/documentAutomationRoutes.js");


const cookieParser = require('cookie-parser');

const app = express();


dotenv.config(); // Load environment variables


// Middleware
const allowedOrigins = ["http://localhost:3000"];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true); // Use `true` instead of `origin`
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(bodyParser.json());
app.use(cookieParser());


// Routes
app.use('/api/user', userRoutes);

app.use("/api/legal-research", legalResearchRoutes);
app.use("/api/ediscovery", eDiscoveryRoutes);
app.use("/api/transcription", transcriptionRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/contract-review", contractReviewRoutes);
app.use("/api/document-automation", documentAutomationRoutes);


// trainNlpModel();

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to ScalesWorks API!' });
});

module.exports = app;

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const contentRoutes = require("./routes/content");

const app = express();
const port = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(
  cors({
    origin: [
      "https://www.artihcus.com",
      "https://artihcus.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(contentRoutes);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Create a Nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send email
const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, response: info.response };
  } catch (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};

// Career form endpoint
app.post("/send-email/career", upload.single("resume"), async (req, res) => {
  try {
    const { name, email, phone, jobTitle } = req.body;
    const resume = req.file;

    // Validate required fields
    if (!name || !email || !phone || !resume) {
      return res.status(400).json({ error: "All fields (name, email, phone, resume) are required." });
    }

    const positionLine = jobTitle ? `Position applied for: ${jobTitle}\n\n` : "";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "info@artihcus.com",
      subject: jobTitle ? `Career Application: ${jobTitle} - Artihcus Global` : "New Career Application - Artihcus Global",
      text: `
        New Career Application Details:
        ${positionLine}Name: ${name}
        Email: ${email}
        Phone: ${phone}
      `,
      attachments: [
        {
          filename: resume.originalname,
          content: resume.buffer,
        },
      ],
    };

    const result = await sendEmail(mailOptions);
    res.status(200).json({ message: "Application submitted successfully.", ...result });
  } catch (error) {
    res.status(500).json({ error: `Failed to submit application: ${error.message}` });
  }
});

// Contact form endpoint
app.post("/send-email/contacthome", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      number,
      companyName,
      country,
      industry,
      services,
      referredBy,
      referredName,
      message,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !number || !companyName) {
      return res.status(400).json({ error: "Required fields are missing (firstName, lastName, email, number, companyName)." });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "info@artihcus.com",
      subject: "New Contact Form Submission - Artihcus Global",
      text: `
        New Contact Form Submission:
        
        Personal Information:
        Full Name: ${firstName} ${lastName}
        Email: ${email}
        Phone: ${number}
        
        Company Information:
        Company Name: ${companyName}
        Country: ${country || "N/A"}
        Industry: ${industry || "N/A"}
        
        Interest:
        Services Interested In: ${services || "N/A"}
        
        Referral Information:
        Referred By: ${referredBy || "N/A"}
        Referred Name: ${referredName || "N/A"}
        
        Message:
        ${message || "No message provided."}
      `,
    };

    const result = await sendEmail(mailOptions);
    res.status(200).json({
      message: "Your message has been sent successfully!",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      error: `Failed to send message: ${error.message}`,
    });
  }
});

const start = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } catch (err) {
      console.warn("MongoDB connection failed:", err.message);
    }
  }
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

start();

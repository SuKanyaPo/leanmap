const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const multer = require("multer");

const port = 5000;
const app = express();

const storagePic = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Files/"); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename for uploaded files
  },
});

const uploadPic = multer({
  storage: storagePic,
  limits: {
    fileSize: 2000 * 1024 * 1024, // 15 MB
  },
});

// API endpoint to handle file uploads and store TIFF files in "Files/" directory
app.post("/upload", uploadPic.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a file" });
  }
  try {
    // Optionally, you can perform further processing here if needed
    res.status(200).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"); // Allow specified methods
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Allow specified headers
  next();
});

// Start the server
app.listen(port, function () {
  console.log(`App listening on port ${port}`);
});

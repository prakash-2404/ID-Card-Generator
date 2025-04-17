const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { createCanvas, loadImage } = require("canvas");
const bodyParser = require("body-parser");
const { pool, initDatabase } = require("./database");
const QRCode = require("qrcode");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Create certificates directory if it doesn't exist
const certificatesDir = path.join(__dirname, "public", "certificates");
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}
// Update multer configuration to handle multiple files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "photo") {
      cb(null, uploadsDir);
    } else if (file.fieldname === "certificate") {
      cb(null, certificatesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      const fileTypes = /jpeg|jpg|png/;
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg and .jpeg format allowed for photos!"));
      }
    } else if (file.fieldname === "certificate") {
      const fileTypes = /jpeg|jpg|png|pdf/;
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype =
        fileTypes.test(file.mimetype) || file.mimetype === "application/pdf";

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(
          new Error(
            "Only .png, .jpg, .jpeg, and .pdf formats allowed for certificates!"
          )
        );
      }
    }
  },
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Serve the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
// In server.js, add this new endpoint
app.get("/api/check-user/:aadhar", async (req, res) => {
  try {
    const aadhar = req.params.aadhar;
    const result = await pool.query(
      "SELECT COUNT(*) FROM users WHERE aadhar = $1",
      [aadhar]
    );

    const exists = parseInt(result.rows[0].count) > 0;

    res.json({
      exists: exists,
    });
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({
      success: false,
      message: "Error checking user existence",
    });
  }
});
// API to save user data
// Update the API route to handle both photo and certificate uploads
app.post(
  "/api/submit",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "certificate", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        address,
        fatherName,
        dob,
        bloodGroup,
        education,
        occupation,
        aadhar,
        voterID,
        memberNo,
        branch,
        district,
      } = req.body;

      const photoPath = req.files["photo"]
        ? `/uploads/${req.files["photo"][0].filename}`
        : null;
      const certificatePath = req.files["certificate"]
        ? `/certificates/${req.files["certificate"][0].filename}`
        : null;

      // Save to database with certificate path
      const result = await pool.query(
        "INSERT INTO users (full_name, email, phone, address, father_name, dob, blood_group, education, occupation, aadhar, voter_id, member_no, branch, district, photo_path, certificate_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id",
        [
          fullName,
          email,
          phone,
          address,
          fatherName,
          dob,
          bloodGroup,
          education,
          occupation,
          aadhar,
          voterID,
          memberNo,
          branch,
          district,
          photoPath,
          certificatePath,
        ]
      );

      const userId = result.rows[0].id;

      res.json({
        success: true,
        message: "User data saved successfully",
        userId,
        photoPath,
        certificatePath,
      });
    } catch (error) {
      console.error("Error saving user data:", error);
      res.status(500).json({
        success: false,
        message: "Error saving user data",
      });
    }
  }
);
// app.post("/api/submit", upload.single("photo"), async (req, res) => {
//   try {
//     const {
//       fullName,
//       email,
//       phone,
//       address,
//       fatherName,
//       dob,
//       bloodGroup,
//       education,
//       occupation,
//       aadhar,
//       voterID,
//       memberNo,
//       branch,
//       district,
//     } = req.body;
//     const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

//     // Save to database
//     const result = await pool.query(
//       "INSERT INTO users (full_name, email, phone, address, father_name, dob, blood_group, education, occupation, aadhar, voter_id, member_no, branch, district, photo_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id",
//       [
//         fullName,
//         email,
//         phone,
//         address,
//         fatherName,
//         dob,
//         bloodGroup,
//         education,
//         occupation,
//         aadhar,
//         voterID,
//         memberNo,
//         branch,
//         district,
//         photoPath,
//       ]
//     );

//     const userId = result.rows[0].id;

//     res.json({
//       success: true,
//       message: "User data saved successfully",
//       userId,
//       photoPath,
//     });
//   } catch (error) {
//     console.error("Error saving user data:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error saving user data",
//     });
//   }
// });

// API to generate ID card based on the single template
app.get("/api/generate-card/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user data from database
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    // Create canvas for ID card based on template dimensions
    // Using dimensions from the image (1400x467)
    const canvas = createCanvas(1400, 467);
    const ctx = canvas.getContext("2d");

    // Load the template image
    const templateImage = await loadImage(
      path.join(__dirname, "public", "img", "id-card-template.jpg")
    );
    ctx.drawImage(templateImage, 0, 0, 1400, 467);

    // Load user photo if available
    if (user.photo_path) {
      const userPhoto = await loadImage(
        path.join(__dirname, "public", user.photo_path)
      );

      // Draw user photo in the left side box marked "PHOTO" in the template
      // Adjust these coordinates to match the photo placement in the template
      ctx.drawImage(userPhoto, 85, 200, 165, 195); // These coordinates place the photo in the left box
    }

    // Set font for all text
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#000000";

    const memberId = user.member_no || user.id.toString().padStart(6, "0");

    // Left side data (personal details) - Matching template order
    ctx.fillText(memberId, 490, 237); // Member ID (உறுப்பினர் எண்)
    ctx.fillText(user.full_name, 490, 271); // Name (பெயர்)
    ctx.fillText(user.father_name || "N/A", 490, 305); // Father's name (தந்தை கணவர் பெயர்)
    ctx.fillText(formatDate(user.dob) || "N/A", 490, 339); // Date of birth (பிறந்த தேதி)
    ctx.fillText(user.blood_group || "N/A", 490, 373); // Blood group (இரத்தம் வகை)

    // Right side data - Matching template order based on the image
    ctx.fillText(user.education || "N/A", 920, 62); // Education (கல்வி)
    ctx.fillText(user.occupation || "N/A", 920, 97); // Occupation (தொழில்)

    // Additional fields on the right side following template order
    ctx.fillText(user.phone || "N/A", 920, 128); // Mobile number (அலைபேசி எண்)
    ctx.fillText(user.voter_id || "N/A", 920, 202); // Voter ID (வாக்காளர் அடை எண்)
    ctx.fillText(user.aadhar || "N/A", 920, 237); // Aadhar number (ஆதார் எண்)
    ctx.fillText(user.email || "N/A", 920, 268); // Email (மின்னஞ்சல்)

    // Handle address with word wrapping
    if (user.address) {
      const maxWidth = 400; // Maximum width for text before wrapping
      const lineHeight = 28; // Space between lines
      const words = user.address.split(" ");
      let line = "";
      let y = 305; // Starting y position for the address adjusted to 300

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, 920, y);
          line = words[i] + " ";
          y += lineHeight;

          // Check if we're going too far down (adjusted max y value based on new starting point)
          if (y > 385) {
            // Increased from 180 to match the new starting point
            line += "...";
            ctx.fillText(line, 920, y);
            break;
          }
        } else {
          line = testLine;
        }
      }

      // Don't forget to draw the last line (adjusted check value)
      if (y <= 385) {
        // Increased from 180 to match the new starting point
        ctx.fillText(line, 920, y);
      }
    } else {
      ctx.fillText("N/A", 920, 305); // Adjusted to match the new starting position
    }

    // Generate QR code for the member ID
    // First, create a QR code data URL using qrcode library
    const qrCodeDataURL = await QRCode.toDataURL(memberId, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 150,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Convert the QR code data URL to an image
    const qrCodeImage = await loadImage(qrCodeDataURL);

    // Adjust these values to fit your exact template
    ctx.drawImage(qrCodeImage, 1180, 40, 180, 180);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    // Set response headers
    res.set({
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename=id-card-${userId}.png`,
    });

    // Send the image
    res.send(buffer);
  } catch (error) {
    console.error("Error generating ID card:", error);
    res.status(500).json({
      success: false,
      message: "Error generating ID card",
    });
  }
});

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
}

// View ID card page
app.get("/view-card/:userId", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "idcard.html"));
});

// Initialize database and start the server
initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

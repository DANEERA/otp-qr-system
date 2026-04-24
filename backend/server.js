const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const axios = require("axios");
const cors = require("cors");
const prisma = require("./prismaClient");

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ruhunutetea-frontend.onrender.com",
      "https://otp-qr-syste.onrender.com"
    ],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1); // 🔥 MUST add

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production", // HTTPS required
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpSms(phone, otp) {
  const response = await axios.post("https://app.notify.lk/api/v1/send", {
    user_id: process.env.NOTIFY_USER_ID,
    api_key: process.env.NOTIFY_API_KEY,
    sender_id: process.env.NOTIFY_SENDER_ID || "NotifyDEMO",
    to: phone,
    message: `Your Ruhunu Tea OTP is ${otp}`,
  });

  return response.data;
}

function requireOtpVerified(req, res, next) {
  if (!req.session.otpVerified) {
    return res.status(401).json({
      success: false,
      message: "OTP verification required first",
    });
  }
  next();
}

function requireLoggedIn(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Not logged in",
    });
  }
  next();
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ruhunu Tea OTP + QR API running",
  });
});

app.post("/send-login-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^94\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: "Use valid phone format: 947XXXXXXXX",
      });
    }

    const otp = generateOtp();

    await prisma.otp.create({
      data: {
        phone,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    req.session.loginPhone = phone;
    req.session.otpVerified = false;
    req.session.userId = null;

    await sendOtpSms(phone, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("send-login-otp error:", err.response?.data || err.message || err);
    return res.status(500).json({
      success: false,
      message: "OTP send failed",
    });
  }
});

app.post("/resend-login-otp", async (req, res) => {
  try {
    const phone = req.session.loginPhone;

    if (!phone) {
      return res.json({
        success: false,
        message: "No phone session found",
      });
    }

    const otp = generateOtp();

    await prisma.otp.create({
      data: {
        phone,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpSms(phone, otp);

    return res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    console.error("resend-login-otp error:", err.response?.data || err.message || err);
    return res.status(500).json({
      success: false,
      message: "Resend failed",
    });
  }
});

app.post("/verify-login-otp", async (req, res) => {
  try {
    const { otp } = req.body;
    const phone = req.session.loginPhone;

    if (!phone) {
      return res.json({
        success: false,
        message: "No OTP session found",
      });
    }

    const record = await prisma.otp.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return res.json({
        success: false,
        message: "No OTP found",
      });
    }

    if (record.isUsed) {
      return res.json({
        success: false,
        message: "OTP already used",
      });
    }

    if (Date.now() > new Date(record.expiresAt).getTime()) {
      return res.json({
        success: false,
        message: "OTP expired",
      });
    }

    if (String(record.code) !== String(otp)) {
      return res.json({
        success: false,
        message: "Wrong OTP",
      });
    }

    await prisma.otp.update({
      where: { id: record.id },
      data: { isUsed: true },
    });

    req.session.otpVerified = true;

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("verify-login-otp error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
});

app.get("/api/verify-book-qr/:scannedData", requireOtpVerified, async (req, res) => {
  try {
    const scannedValue = String(req.params.scannedData).trim();

    const user = await prisma.user.findUnique({
      where: { bookNumber: scannedValue },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "අවලංගු QR පතකි! මෙම පොත් අංකය පද්ධතියේ නැත.",
      });
    }

    req.session.userId = user.id;

    return res.json({
      success: true,
      name: user.fullName,
      bookNo: user.bookNumber,
      user: {
        id: user.id,
        fullName: user.fullName,
        bookNumber: user.bookNumber,
        mobileNumber: user.mobileNumber || req.session.loginPhone || "",
      },
    });
  } catch (err) {
    console.error("verify-book-qr error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Server error occurred.",
    });
  }
});

app.get("/api/profile", requireLoggedIn, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        bookNumber: user.bookNumber,
        mobileNumber: user.mobileNumber || req.session.loginPhone || "",
      },
    });
  } catch (err) {
    console.error("profile error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// NEW DASHBOARD API
app.get("/api/dashboard", requireLoggedIn, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // later DB tables වලින් ගන්න පුළුවන්
    const dashboard = {
      user: {
        id: user.id,
        fullName: user.fullName,
        bookNumber: user.bookNumber,
        mobileNumber: user.mobileNumber || req.session.loginPhone || "",
      },
      summary: {
        totalLeavesKg: 0.0,
        pendingAmount: 0.0,
        paidAmount: 0.0,
      },
      deliveries: [
        {
          date: "2026-03-19",
          type: "අමු දලු",
          qty: 12.5,
          status: "සම්පූර්ණ",
        },
      ],
    };

    return res.json({
      success: true,
      dashboard,
    });
  } catch (err) {
    console.error("dashboard error:", err.message || err);
    return res.status(500).json({
      success: false,
      message: "Dashboard load failed",
    });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: "Logged out",
    });
  });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
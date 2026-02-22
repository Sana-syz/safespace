const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio"); // for SMS + calls
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Twilio setup (from .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const trustedContacts = process.env.TRUSTED_CONTACTS
  ? process.env.TRUSTED_CONTACTS.split(",")
  : [];

const client = twilio(accountSid, authToken);

// Debug log to confirm contacts loaded
console.log("Trusted contacts:", trustedContacts);

// 1. Detect danger (dummy endpoint for AI integration)
app.post("/detect-danger", (req, res) => {
  const { signal } = req.body;
  if (signal === "danger") {
    res.json({ status: "Danger detected", alert: true });
  } else {
    res.json({ status: "Safe", alert: false });
  }
});

// 2. Send instant alerts (SMS + Call)
app.post("/send-alert", async (req, res) => {
  const { location } = req.body;
  try {
    for (let contact of trustedContacts) {
      // 📩 Send SMS
      await client.messages.create({
        body: `🚨 SafeSpace Alert! Possible danger detected at ${location}.`,
        from: fromNumber,
        to: contact,
      });

      // 📞 Make Call
      await client.calls.create({
        twiml: `<Response><Say>🚨 SafeSpace Alert! Possible danger detected at ${location}. Please check immediately.</Say></Response>`,
        from: fromNumber,
        to: contact,
      });
    }
    res.json({ status: "SMS + Calls sent successfully" });
  } catch (error) {
    console.error("❌ Error sending alerts:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Suggest safer paths (dummy route)
app.get("/safe-path", (req, res) => {
  res.json({
    currentLocation: "User Location",
    suggestedPath: [
      "Main Street (well-lit)",
      "Police Station nearby",
      "Avoid Dark Alley",
    ],
  });
});

// 4. Offline fallback (simulate SMS-only mode)
app.post("/offline-alert", async (req, res) => {
  const { message } = req.body;
  try {
    for (let contact of trustedContacts) {
      await client.messages.create({
        body: `SafeSpace Offline Alert: ${message}`,
        from: fromNumber,
        to: contact,
      });
    }
    res.json({ status: "Offline alerts sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Server startup message
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ SafeSpace backend running on port ${PORT}`));
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

/* ================================
   ENVIRONMENT VARIABLES (Render)
================================ */
const VERIFY_TOKEN = "ambulance123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

/* ================================
   TEST ROUTE (Check server live)
================================ */
app.get("/", (req, res) => {
  res.send("🚑 1 Minute Ambulance Bot Running");
});

/* ================================
   WEBHOOK VERIFICATION (META)
================================ */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

/* ================================
   RECEIVE WHATSAPP MESSAGE
================================ */
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body?.toLowerCase();

    console.log("Incoming:", text);

    let reply = "";

    if (text.includes("ambulance")) {
      reply =
`🚑 *1 Minute Ambulance*

1️⃣ Book Ambulance
2️⃣ Track Ambulance
3️⃣ Emergency Help`;
    }

    else if (text === "1") {
      reply = "✅ Ambulance booked! Driver arriving in 1 minute.";
    }

    else {
      reply = "Type *ambulance* to start 🚑";
    }

    /* SEND MESSAGE BACK */
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.sendStatus(200);

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚑 Server running on port ${PORT}`);
});
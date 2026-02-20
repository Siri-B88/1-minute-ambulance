const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

/* ===============================
   CONFIGURATION
================================*/
const VERIFY_TOKEN = "ambulance123";
const TOKEN =
  "EAAKzgxH1MtIBQ8GkPWCxwrSPZAgXjcOfq7CAmcLupZB0PmFpIyzscA0OQEtQZCohMtICINeabzwXP5qgZBfdYuw6xn62RJjK5aIPGZCaGEjOaeJp9GqPPoPlIWAVIKtxkj5tr6W7YCgxDlEaXaJluMZAdAGOeGVTxsf3Pnq1eFedKvasRVMp43OIn1ZCRQBjMkOFquZAOh3EM7hf0MxC9MzZAWkFYg94QanZBWcZCIKKYagnKNZBXMqB7tCMAgvDjom6wFN5uRDK0QHZATAD9EojEU5e9TZBxqzQOF42QGGawMLQZDZD";
const PHONE_NUMBER_ID = "975045772364638";

/* ===============================
   WEBHOOK VERIFICATION (META)
================================*/
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

/* ===============================
   RECEIVE WHATSAPP MESSAGES
================================*/
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";

    let reply = "";

    if (text.includes("ambulance")) {
      reply = `🚑 *1 Minute Ambulance*

1️⃣ Book Ambulance
2️⃣ Track Ambulance
3️⃣ Emergency Help`;
    } else if (text === "1") {
      reply = "✅ Ambulance booked! Driver arriving in 1 minute.";
    } else if (text === "2") {
      reply = "📍 Ambulance is 2 minutes away.";
    } else {
      reply = "Type *ambulance* to start.";
    }

    /* SEND REPLY */
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

/* ===============================
   SERVER START
================================*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚑 Ambulance Bot Running on Port ${PORT}`));

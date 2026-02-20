const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { readDB, writeDB } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ================= WHATSAPP CONFIG ================= */

const VERIFY_TOKEN = "ambulance123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

/* ================= HOME ================= */

app.get("/", (req, res) => {
  res.send("🚑 1 Minute Ambulance Backend Running");
});

/* ================= USER SIGNUP ================= */

app.post("/api/user/signup", (req, res) => {
  const { name, email, password } = req.body;

  const db = readDB();

  if (db.users.find(u => u.email === email))
    return res.status(400).json({ message: "User exists" });

  db.users.push({ name, email, password });
  writeDB(db);

  res.json({ message: "Signup success" });
});

/* ================= DRIVER REGISTER ================= */

app.post("/api/driver/signup", (req, res) => {
  const { name, email, vehicle } = req.body;

  const db = readDB();

  db.drivers.push({
    id: Date.now(),
    name,
    email,
    vehicle,
    lat: null,
    lng: null
  });

  writeDB(db);

  res.json({ message: "Driver added" });
});

/* ================= UPDATE DRIVER LOCATION ================= */

app.post("/api/driver/location", (req, res) => {
  const { email, lat, lng } = req.body;

  const db = readDB();

  const driver = db.drivers.find(d => d.email === email);

  if (!driver) return res.status(404).json({ message: "Driver not found" });

  driver.lat = lat;
  driver.lng = lng;

  writeDB(db);

  res.json({ message: "Location updated" });
});

/* ================= BOOK AMBULANCE ================= */

app.post("/api/bookings", (req, res) => {
  const { userName, pickup } = req.body;

  const db = readDB();

  if (!db.drivers.length)
    return res.status(400).json({ message: "No drivers available" });

  const driver = db.drivers[0];

  const booking = {
    id: Date.now(),
    userName,
    pickup,
    driver: driver.name,
    status: "pending"
  };

  db.bookings.push(booking);
  writeDB(db);

  res.json(booking);
});

/* ================= WHATSAPP VERIFY ================= */

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

/* ================= RECEIVE WHATSAPP ================= */

app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body?.toLowerCase() || "";

    let reply = "";

    if (text.includes("ambulance")) {
      reply =
`🚑 *1 Minute Ambulance*

1️⃣ Book Ambulance
2️⃣ Track Ambulance
3️⃣ Emergency Help`;
    }

    if (reply) {
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
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err.message);
    res.sendStatus(500);
  }
});

/* ================= START SERVER ================= */

app.listen(PORT, () =>
  console.log(`🚑 Server running on ${PORT}`)
);
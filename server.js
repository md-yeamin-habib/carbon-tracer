const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ================= CORS =================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("CarbonTracer API is running 🚀");
});

// ================= ANALYZE =================
app.get("/analyze", (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing lat/lng" });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  let region = "Unknown Region";

  if (latitude > 20) {
    region = "Urban Industrial Zone";
  } else {
    region = "Semi-Rural Region";
  }

  const gridSize = 10;

  const gridX = Math.floor(latitude * gridSize);
  const gridY = Math.floor(longitude * gridSize);

  res.json({
    region,
    coordinates: {
      lat: latitude,
      lng: longitude
    },

    grid: {
      x: gridX,
      y: gridY,
      label: `Grid (${gridX}, ${gridY})`
    },

    analysis:
      "High carbon emissions due to dense traffic, industrial activity, and low green cover.",

    recommendation:
      "Increase urban greenery, enforce emission regulations, and promote public transport.",

    future: {
      positiveImage: "https://via.placeholder.com/600x300?text=Positive+Future",
      positiveNote:
        "Cleaner air, improved biodiversity, and sustainable infrastructure.",

      negativeImage: "https://via.placeholder.com/600x300?text=Negative+Future",
      negativeNote:
        "Severe pollution, health risks, and environmental degradation."
    }
  });
});

// ================= SIMPLE CACHE (optional but useful) =================
const geoCache = new Map();

// ================= REVERSE GEOCODE =================
app.get("/reverse-geocode", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ name: "Missing coordinates" });
  }

  const key = `${lat},${lng}`;

  if (geoCache.has(key)) {
    return res.json({ name: geoCache.get(key) });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "carbontracer/1.0",
          "Accept": "application/json"
        }
      }
    );
    if (!response.ok) {
      console.error("Nominatim error:", response.status);
      return res.json({ name: "Unknown Location" });
    }
    const text = await response.text();
    console.log("Raw Response : ", text);
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Non-JSON response from Nominatim:", text);
      return res.json({ name: "Unknown Location" });
    }

    const name = data?.display_name || "Unknown Location";

    // store in cache
    geoCache.set(key, name);

    res.json({ name });

  } catch (err) {
    console.error("Reverse geocode error:", err);
    res.json({ name: "Unknown Location" });
  }
});

// ================= ABOUT =================
app.get("/about", (_, res) => {
  fs.readFile("about.txt", "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file");
    }
    res.send(data);
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

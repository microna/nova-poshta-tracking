// server.js - Direct route handling for tracking requests
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API health check endpoint
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", message: "Proxy server is running" });
});

// Define specific route for tracking with courier and tracking number
app.get("/api/trackings/:courier/:trackingNumber", async (req, res) => {
  try {
    const apiKey = req.headers["as-api-key"];
    const { courier, trackingNumber } = req.params;

    if (!apiKey) {
      return res
        .status(400)
        .json({ error: { message: "API key is required" } });
    }

    console.log(`Looking up tracking: ${courier}/${trackingNumber}`);

    const url = `https://api.aftership.com/tracking/2025-01/trackings/${courier}/${trackingNumber}`;
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
      validateStatus: (status) => true,
    });

    console.log(`AfterShip response status: ${response.status}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Tracking Error:", error.message);
    return res.status(500).json({
      error: { message: `Server error: ${error.message}` },
    });
  }
});

// Define specific route for tracking with only tracking number
app.get("/api/trackings/:trackingNumber", async (req, res) => {
  try {
    const apiKey = req.headers["as-api-key"];
    const { trackingNumber } = req.params;

    if (!apiKey) {
      return res
        .status(400)
        .json({ error: { message: "API key is required" } });
    }

    console.log(`Looking up tracking: ${trackingNumber}`);

    const url = `https://api.aftership.com/tracking/2025-01/trackings/${trackingNumber}`;
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
      validateStatus: (status) => true,
    });

    console.log(`AfterShip response status: ${response.status}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Tracking Error:", error.message);
    return res.status(500).json({
      error: { message: `Server error: ${error.message}` },
    });
  }
});

// Route for getting multiple trackings
app.get("/api/trackings", async (req, res) => {
  try {
    const apiKey = req.headers["as-api-key"];

    if (!apiKey) {
      return res
        .status(400)
        .json({ error: { message: "API key is required" } });
    }

    const url = "https://api.aftership.com/tracking/2025-01/trackings";
    const response = await axios({
      method: "GET",
      url: url,
      params: req.query,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
      validateStatus: (status) => true,
    });

    console.log(`AfterShip multi-tracking response status: ${response.status}`);
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Multi-tracking Error:", error.message);
    return res.status(500).json({
      error: { message: `Server error: ${error.message}` },
    });
  }
});

// Route for creating a new tracking
app.post("/api/trackings", async (req, res) => {
  try {
    const apiKey = req.headers["as-api-key"];

    if (!apiKey) {
      return res
        .status(400)
        .json({ error: { message: "API key is required" } });
    }

    const url = "https://api.aftership.com/tracking/2025-01/trackings";
    const response = await axios({
      method: "POST",
      url: url,
      data: req.body,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
      validateStatus: (status) => true,
    });

    console.log(
      `AfterShip create tracking response status: ${response.status}`
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Create tracking Error:", error.message);
    return res.status(500).json({
      error: { message: `Server error: ${error.message}` },
    });
  }
});

// Serve static files (your HTML app)
app.use(express.static("public"));

// Fallback route for SPA
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    res.status(404).json({ error: { message: "API endpoint not found" } });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Access your application at http://localhost:${PORT}`);
});

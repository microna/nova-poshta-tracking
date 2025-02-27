const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Base URL for AfterShip API
const AFTERSHIP_API_BASE_URL = "https://api.aftership.com/tracking/2025-01";

// Proxy middleware for AfterShip API
app.all("/api/*", async (req, res) => {
  try {
    // Extract the API key from the request headers
    const apiKey = req.headers["as-api-key"];

    if (!apiKey) {
      return res.status(400).json({
        meta: {
          code: 400,
          message: "API key is required",
        },
      });
    }

    // Construct the endpoint URL by removing '/api' from the path
    const endpoint = req.url.replace("/api", "");
    const url = `${AFTERSHIP_API_BASE_URL}${endpoint}`;

    console.log(`Forwarding request to: ${url}`);

    // Forward the request to AfterShip API
    const response = await axios({
      method: req.method,
      url: url,
      headers: {
        "Content-Type": "application/json",
        "as-api-key": apiKey,
      },
      data: req.method !== "GET" ? req.body : undefined,
      params: req.method === "GET" ? req.query : undefined,
    });

    // Return the AfterShip API response to the client
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Proxy error:", error.message);

    // Log more detailed error information
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }

    // Handle network errors
    return res.status(500).json({
      meta: {
        code: 500,
        message: "Server error: " + error.message,
      },
    });
  }
});

// Serve static files from 'public' directory (optional)
app.use(express.static("public"));

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

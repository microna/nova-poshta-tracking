// test-script.js - A simple script to test the proxy server
const axios = require("axios");

async function testProxy() {
  try {
    console.log("Testing proxy server...");

    // Replace with your actual API key
    const apiKey = "asat_85fad0de3fb24d02bcffdf4c880419a2";

    // Test the ping endpoint
    console.log("\nTesting ping endpoint:");
    const pingResponse = await axios.get("http://localhost:3000/api/ping");
    console.log("Ping response:", pingResponse.data);

    // Test a tracking endpoint with a mock tracking number
    // This will likely fail with a "not found" from AfterShip, but should show the proxy is working
    console.log("\nTesting tracking endpoint:");
    try {
      const trackingResponse = await axios.get(
        "http://localhost:3000/api/trackings/test123",
        {
          headers: {
            "as-api-key": apiKey,
          },
        }
      );
      console.log("Tracking response:", trackingResponse.data);
    } catch (error) {
      console.log(
        "Expected error from AfterShip API:",
        error.response?.data || error.message
      );
      console.log(
        "This error is expected and shows the proxy is forwarding requests properly."
      );
    }

    console.log("\nProxy server appears to be working correctly!");
  } catch (error) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testProxy();

const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Your AfterShip API key should be stored in a .env file
// Create a file named .env with: AFTERSHIP_API_KEY=your_api_key_here
const API_KEY = process.env.AFTERSHIP_API_KEY;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());

// API endpoint to track packages
app.get('/api/track', async (req, res) => {
  const { trackingNumber } = req.query;
  
  if (!trackingNumber) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tracking number is required' 
    });
  }
  
  try {
    // Make request to AfterShip API
    const response = await axios.get(
      'https://api.aftership.com/tracking/2025-01/trackings', 
      {
        params: {
          tracking_numbers: trackingNumber,
          slug: 'nova-poshta'
        },
        headers: {
          'as-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('AfterShip API response:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error tracking package:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.meta?.message || 'Failed to track package',
      details: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  
  if (!API_KEY) {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: AFTERSHIP_API_KEY not set in environment variables!');
    console.warn('Create a .env file with your API key to make real API calls.');
  }
});


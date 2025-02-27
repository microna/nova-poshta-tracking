// AfterShip Tracking API Client
const axios = require('axios');

class AfterShipClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.aftership.com/tracking/2025-01';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'as-api-key': 'asat_85fad0de3fb24d02bcffdf4c880419a2'
      }
    });
  }

  /**
   * Get tracking information for a specific tracking number
   * @param {string} trackingNumber - The tracking number to query
   * @param {string} [courier] - Optional courier slug
   * @returns {Promise} - Promise containing tracking data
   */
  async getTracking(trackingNumber, courier = null) {
    try {
      let endpoint = `/trackings/${trackingNumber}`;
      if (courier) {
        endpoint = `/trackings/${courier}/${trackingNumber}`;
      }
      
      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching tracking info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all trackings with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} - Promise containing trackings data
   */
  async getTrackings(params = {}) {
    try {
      const response = await this.client.get('/trackings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trackings:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a new tracking
   * @param {string} trackingNumber - The tracking number
   * @param {string} courier - The courier slug
   * @param {Object} additionalData - Additional tracking data
   * @returns {Promise} - Promise containing created tracking data
   */
  async createTracking(trackingNumber, courier, additionalData = {}) {
    try {
      const payload = {
        tracking: {
          tracking_number: trackingNumber,
          slug: courier,
          ...additionalData
        }
      };
      
      const response = await this.client.post('/trackings', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating tracking:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Example usage
async function main() {
  // Replace with your actual API key
  const apiKey = 'asat_85fad0de3fb24d02bcffdf4c880419a2';
  const client = new AfterShipClient(apiKey);
  
  try {
    // Example 1: Get tracking info for a specific tracking number
    const trackingInfo = await client.getTracking('jh865r66gc6hi');
    console.log('Tracking Info:', JSON.stringify(trackingInfo, null, 2));
    
    // Example 2: Get all trackings with limit and page
    const allTrackings = await client.getTrackings({ 
      limit: 10,
      page: 1 
    });
    console.log('All Trackings:', JSON.stringify(allTrackings, null, 2));
    
    // Example 3: Create a new tracking
    const newTracking = await client.createTracking(
      'new_tracking_number',
      'fedex',
      {
        title: 'My Package',
        customer_name: 'John Doe',
        destination_country_iso3: 'USA'
      }
    );
    console.log('New Tracking:', JSON.stringify(newTracking, null, 2));
    
  } catch (error) {
    console.error('Operation failed:', error);
  }
}

// Uncomment to run the example
main();

module.exports = AfterShipClient;
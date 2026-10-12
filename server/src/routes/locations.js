const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { INDIA_STATES } = require('../utils/indiaLocations');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Strict rate limit for Nominatim (1 req per second is OSM policy, we'll limit per client IP)
const reverseGeoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many location requests, please try again later.' }
});

// GET /api/locations/states
// Returns full static list of states (36)
router.get('/states', (req, res) => {
  res.json({
    status: 'success',
    data: INDIA_STATES
  });
});

// GET /api/locations/districts?state=StateName
// Returns distinct districts for the given state, merged with static fallback
router.get('/districts', async (req, res, next) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ error: 'state query parameter is required' });
    }

    // 1. Get from DB
    const dbDistricts = await Hospital.distinct('district', { state });

    // 2. Get from fallback JSON
    let fallbackDistricts = [];
    try {
      const fallbackData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/indiaDistricts.json'), 'utf8'));
      if (fallbackData[state]) {
        fallbackDistricts = fallbackData[state];
      }
    } catch (e) {
      console.error('Failed to load fallback districts:', e.message);
    }

    // Merge and dedup, and add 'Other' if not present
    const combined = new Set([...dbDistricts, ...fallbackDistricts]);
    const districtsArray = Array.from(combined).sort((a, b) => a.localeCompare(b));
    
    // Ensure "Other" is at the end or included
    if (!districtsArray.includes('Other')) {
      districtsArray.push('Other');
    }

    res.json({
      status: 'success',
      data: districtsArray
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/locations/reverse?lat=X&lng=Y
router.get('/reverse', reverseGeoLimiter, async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Call Nominatim with proper User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const response = await axios.get(nominatimUrl, {
      headers: {
        'User-Agent': 'LifeConnect-App/1.0 (contact@lifeconnect.example.com)'
      },
      timeout: 5000
    });

    const data = response.data;
    if (!data || data.error) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const addr = data.address || {};
    let state = addr.state || addr.province || '';
    let district = addr.state_district || addr.county || addr.district || '';
    let city = addr.city || addr.town || addr.village || addr.suburb || '';

    // Strip " District" from district name
    if (district.toLowerCase().endsWith(' district')) {
      district = district.slice(0, -9).trim();
    }

    // Attempt to match state with our canonical list
    const matchedState = INDIA_STATES.find(s => 
      s.toLowerCase() === state.toLowerCase()
    );

    res.json({
      status: 'success',
      data: {
        state: matchedState || state,
        district: district,
        city: city
      }
    });
  } catch (error) {
    console.error('Nominatim error:', error.message);
    res.status(502).json({ error: 'Failed to fetch location from OSM' });
  }
});

module.exports = router;

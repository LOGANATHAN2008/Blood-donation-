import { INDIA_STATES } from './indiaStates';
import indiaDistrictsData from './indiaDistricts.json';
import api from './api';

/**
 * Normalizes string for comparison (removes accents, special chars, extra spaces, lowercase)
 */
function cleanStr(s) {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Best match for Indian State from string
 */
export function matchState(rawState) {
  if (!rawState) return '';
  const cleaned = cleanStr(rawState);
  
  // 1. Exact match
  const exact = INDIA_STATES.find(s => cleanStr(s) === cleaned);
  if (exact) return exact;

  // 2. Starts with / Contains
  const fuzzy = INDIA_STATES.find(s => {
    const cs = cleanStr(s);
    return cleaned.includes(cs) || cs.includes(cleaned);
  });
  return fuzzy || rawState;
}

/**
 * Best match for District within a state
 */
export function matchDistrict(stateName, candidateNames = []) {
  if (!stateName) return candidateNames[0] || '';
  const validDistricts = indiaDistrictsData[stateName] || [];
  if (validDistricts.length === 0) return candidateNames[0] || '';

  // Clean candidates and strip suffixes like 'district', 'taluk', 'circle'
  const cleanedCandidates = candidateNames
    .filter(Boolean)
    .flatMap(c => {
      const lower = c.trim();
      const stripped = lower
        .replace(/\b(district|taluk|taluka|division|mandal|zone|metropolitan)\b/gi, '')
        .trim();
      return [lower, stripped];
    })
    .filter(Boolean);

  // 1. Exact match
  for (const cand of cleanedCandidates) {
    const candNorm = cleanStr(cand);
    const match = validDistricts.find(d => cleanStr(d) === candNorm);
    if (match) return match;
  }

  // 2. Contains match
  for (const cand of cleanedCandidates) {
    const candNorm = cleanStr(cand);
    if (!candNorm || candNorm.length < 3) continue;
    const match = validDistricts.find(d => {
      const dNorm = cleanStr(d);
      return dNorm.includes(candNorm) || candNorm.includes(dNorm);
    });
    if (match) return match;
  }

  return candidateNames[0] || '';
}

/**
 * Detects current GPS location and returns matched { state, district, city, lat, lng }
 */
export async function detectLiveLocation() {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  // 1. Get browser GPS coordinates
  const coords = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => {
        let msg = 'Failed to get location';
        if (err.code === 1) msg = 'Location access was denied. Please allow location permissions in your browser.';
        else if (err.code === 2) msg = 'Location is unavailable. Please check GPS settings.';
        else if (err.code === 3) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });

  const { latitude, longitude } = coords;

  let rawState = '';
  const candidates = [];
  let detectedCity = '';

  // 2. Strategy A: BigDataCloud Client Reverse Geocode (free, high precision in India, fast)
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      if (bdcData.principalSubdivision) {
        rawState = bdcData.principalSubdivision;
      }
      if (bdcData.city) detectedCity = bdcData.city;
      
      // Collect administrative level candidates (adminLevel 5 is typically district in India)
      if (Array.isArray(bdcData?.localityInfo?.administrative)) {
        for (const admin of bdcData.localityInfo.administrative) {
          if (admin.name && admin.adminLevel >= 4 && admin.adminLevel <= 6) {
            candidates.push(admin.name);
          }
        }
      }
      if (bdcData.city) candidates.push(bdcData.city);
      if (bdcData.locality) candidates.push(bdcData.locality);
    }
  } catch (e) {
    console.warn('BigDataCloud geocode failed, falling back:', e.message);
  }

  // 3. Strategy B: OpenStreetMap Nominatim (if state is still missing or candidates empty)
  if (!rawState || candidates.length === 0) {
    try {
      const osmRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000)
        }
      );
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData?.address || {};
        if (!rawState) rawState = addr.state || addr.province || '';
        if (addr.state_district) candidates.push(addr.state_district);
        if (addr.county) candidates.push(addr.county);
        if (addr.district) candidates.push(addr.district);
        if (addr.city) {
          candidates.push(addr.city);
          if (!detectedCity) detectedCity = addr.city;
        }
        if (addr.town) candidates.push(addr.town);
        if (addr.suburb) candidates.push(addr.suburb);
      }
    } catch (e) {
      console.warn('OSM Nominatim failed:', e.message);
    }
  }

  // 4. Strategy C: Backend reverse endpoint fallback
  if (!rawState || candidates.length === 0) {
    try {
      const backRes = await api.get(`/locations/reverse?lat=${latitude}&lng=${longitude}`, {
        timeout: 4000
      });
      if (backRes.data?.data) {
        const d = backRes.data.data;
        if (!rawState && d.state) rawState = d.state;
        if (d.district) candidates.push(d.district);
        if (d.city) {
          candidates.push(d.city);
          if (!detectedCity) detectedCity = d.city;
        }
      }
    } catch (e) {
      console.warn('Backend reverse failed:', e.message);
    }
  }

  // 5. Canonical matching
  const matchedState = matchState(rawState);
  const matchedDistrict = matchDistrict(matchedState, candidates);

  return {
    state: matchedState,
    district: matchedDistrict,
    city: detectedCity,
    latitude,
    longitude
  };
}

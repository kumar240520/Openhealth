// ============================================================================
// Geolocation & Dynamic Proximity Service
// OpenHealth Multi-Tier Distance & Travel Computation Engine
// ============================================================================

import React, { useState, useEffect } from 'react';

export const CITY_COORDINATES = {
  'indore': { lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  'bhopal': { lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  'jabalpur': { lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  'gwalior': { lat: 26.2183, lng: 78.1828, state: 'Madhya Pradesh' },
  'ujjain': { lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  'mumbai': { lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  'pune': { lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  'nagpur': { lat: 21.1458, lng: 79.0882, state: 'Maharashtra' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'bangalore': { lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  'delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  'new delhi': { lat: 28.6139, lng: 77.2090, state: 'Delhi NCR' },
  'gurugram': { lat: 28.4595, lng: 77.0726, state: 'Haryana' },
  'gurgaon': { lat: 28.4595, lng: 77.0726, state: 'Haryana' },
  'noida': { lat: 28.5355, lng: 77.3910, state: 'Uttar Pradesh' },
  'jaipur': { lat: 26.9124, lng: 75.7873, state: 'Rajasthan' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, state: 'Gujarat' },
  'surat': { lat: 21.1702, lng: 72.8311, state: 'Gujarat' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  'chennai': { lat: 13.0827, lng: 80.2707, state: 'Tamil Nadu' },
  'kolkata': { lat: 22.5726, lng: 88.3639, state: 'West Bengal' },
  'lucknow': { lat: 26.8467, lng: 80.9462, state: 'Uttar Pradesh' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, state: 'Punjab' }
};

const DEFAULT_CITY = 'gwalior';
const STORAGE_KEY_LOCATION = 'openhealth_user_location';
const STORAGE_KEY_GPS_STATUS = 'openhealth_gps_status';
const EVENT_NAME = 'openhealth_location_changed';

/**
 * Standard Haversine distance formula between two GPS coordinates (km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
      lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
    return null;
  }

  const pLat1 = parseFloat(lat1);
  const pLon1 = parseFloat(lon1);
  const pLat2 = parseFloat(lat2);
  const pLon2 = parseFloat(lon2);

  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return null;

  const R = 6371; // Earth's mean radius in km
  const dLat = (pLat2 - pLat1) * (Math.PI / 180);
  const dLon = (pLon2 - pLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pLat1 * (Math.PI / 180)) * Math.cos(pLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  return parseFloat(dist.toFixed(1));
}

/**
 * Calculate estimated driving travel time from distance (assuming ~30 km/h avg urban speed)
 */
export function getEstimatedTravelTime(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return { minutes: 0, text: '-- min' };
  }

  const dist = parseFloat(distanceKm);
  if (dist <= 0) return { minutes: 1, text: '1 min' };

  // Assume avg city traffic speed 28 km/h + 3 mins base dispatch buffer
  const minutes = Math.max(2, Math.round((dist / 28) * 60) + 2);

  if (minutes < 60) {
    return { minutes, text: `${minutes} mins` };
  }

  const hours = Math.floor(minutes / 60);
  const remMins = minutes % 60;
  return {
    minutes,
    text: remMins > 0 ? `${hours}h ${remMins}m` : `${hours} hr`
  };
}

/**
 * Look up coordinates for a city string with normalization
 */
export function getCityCoordinates(cityName) {
  if (!cityName) return CITY_COORDINATES[DEFAULT_CITY];
  const clean = cityName.toLowerCase().split(',')[0].trim();
  return CITY_COORDINATES[clean] || CITY_COORDINATES[DEFAULT_CITY];
}

/**
 * Read cached location from localStorage
 */
export function getCachedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[GeolocationService] Failed reading cached location', e);
  }
  return null;
}

/**
 * Save active location to localStorage & broadcast event
 */
function persistLocation(locationData) {
  try {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(locationData));
  } catch (e) {
    // Ignore storage quota
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: locationData }));
  }
}

/**
 * Resolve user location according to rule:
 * 1. If GPS is already enabled and active, use it.
 * 2. If app starts / logs in and hasn't asked yet: ask for GPS once.
 *    - If granted: store GPS coords.
 *    - If denied/unavailable: fall back to the user's database submitted profile city.
 * 3. If GPS is denied: strictly use database submitted profile city.
 */
export async function resolveUserLocation(profile) {
  const cached = getCachedLocation();
  const gpsStatus = localStorage.getItem(STORAGE_KEY_GPS_STATUS);

  // Determine fallback database city from patient profile
  const dbCity = profile?.patient_details?.city || profile?.city || DEFAULT_CITY;
  const dbCoords = getCityCoordinates(dbCity);
  const fallbackLocation = {
    lat: dbCoords.lat,
    lng: dbCoords.lng,
    source: 'database',
    cityName: dbCity,
    label: `${dbCity.charAt(0).toUpperCase() + dbCity.slice(1)} (From Profile)`
  };

  // If GPS status was already decided as 'granted' and cached coords exist, use them
  if (gpsStatus === 'granted' && cached && cached.source === 'gps') {
    return cached;
  }

  // If GPS status was already decided as 'denied', return database location
  if (gpsStatus === 'denied') {
    persistLocation(fallbackLocation);
    return fallbackLocation;
  }

  // If we haven't asked for GPS yet (first login / startup)
  if (!gpsStatus && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000
        });
      });

      const gpsLocation = {
        lat: parseFloat(position.coords.latitude.toFixed(4)),
        lng: parseFloat(position.coords.longitude.toFixed(4)),
        source: 'gps',
        cityName: dbCity,
        label: 'Live GPS Location'
      };

      localStorage.setItem(STORAGE_KEY_GPS_STATUS, 'granted');
      persistLocation(gpsLocation);
      return gpsLocation;
    } catch (err) {
      console.info('[GeolocationService] GPS access denied or timed out, falling back to database location:', err.message);
      localStorage.setItem(STORAGE_KEY_GPS_STATUS, 'denied');
      persistLocation(fallbackLocation);
      return fallbackLocation;
    }
  }

  // Default fallback
  persistLocation(fallbackLocation);
  return fallbackLocation;
}

/**
 * Manually request GPS location (e.g., if user clicks "Detect My Location" button)
 */
export async function requestGpsLocation(profile) {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  const dbCity = profile?.patient_details?.city || profile?.city || DEFAULT_CITY;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gpsLocation = {
          lat: parseFloat(position.coords.latitude.toFixed(4)),
          lng: parseFloat(position.coords.longitude.toFixed(4)),
          source: 'gps',
          cityName: dbCity,
          label: 'Live GPS Location'
        };
        localStorage.setItem(STORAGE_KEY_GPS_STATUS, 'granted');
        persistLocation(gpsLocation);
        resolve(gpsLocation);
      },
      (err) => {
        localStorage.setItem(STORAGE_KEY_GPS_STATUS, 'denied');
        const dbCoords = getCityCoordinates(dbCity);
        const fallbackLocation = {
          lat: dbCoords.lat,
          lng: dbCoords.lng,
          source: 'database',
          cityName: dbCity,
          label: `${dbCity} (From Profile)`
        };
        persistLocation(fallbackLocation);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Manually switch location to a selected city
 */
export function setManualCity(cityName) {
  const coords = getCityCoordinates(cityName);
  const location = {
    lat: coords.lat,
    lng: coords.lng,
    source: 'manual',
    cityName: cityName,
    label: `${cityName}`
  };
  persistLocation(location);
  return location;
}

/**
 * Compute distance from active user location to a given hospital
 */
export function getDistanceToHospital(hospital, userLocation) {
  if (!hospital) return null;

  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;

  // 1. If hospital has latitude and longitude, compute real Haversine distance
  if (hospital.latitude && hospital.longitude && userLat && userLng) {
    return calculateDistanceKm(userLat, userLng, hospital.latitude, hospital.longitude);
  }

  // 2. If hospital latitude is missing but city is known, compute distance to hospital's city center
  if (hospital.city && userLat && userLng) {
    const hospCityCoords = getCityCoordinates(hospital.city);
    return calculateDistanceKm(userLat, userLng, hospCityCoords.lat, hospCityCoords.lng);
  }

  // 3. Fallback deterministic calculation based on hospital name hash (between 1.8km and 6.4km)
  const code = (hospital.name || 'H').charCodeAt(0) + (hospital.name || 'H').charCodeAt(1 || 0);
  return parseFloat(((code % 6) * 0.8 + 1.8).toFixed(1));
}

/**
 * React hook to access and subscribe to active user location
 */
export function useLocationSubscription() {
  const [currentLocation, setCurrentLocation] = React.useState(getCachedLocation);

  React.useEffect(() => {
    const handleLocationChange = (e) => {
      setCurrentLocation(e.detail);
    };

    window.addEventListener(EVENT_NAME, handleLocationChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleLocationChange);
    };
  }, []);

  return currentLocation;
}

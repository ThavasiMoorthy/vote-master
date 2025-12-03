export async function geocodeAddress(address) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY in your environment.');
  }

  // Add a components filter to bias results to India which helps return local matches
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:IN&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Geocoding request failed');
  }

  const data = await res.json();
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error(data.error_message || 'No results from geocoding');
  }

  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng, raw: data.results[0] };
}

export default geocodeAddress;

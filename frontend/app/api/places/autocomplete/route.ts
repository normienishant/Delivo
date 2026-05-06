import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  const type = req.nextUrl.searchParams.get('type') || 'address';

  if (query.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.OLA_API_KEY;
  const location = req.nextUrl.searchParams.get('location') || '';
  let predictions: any[] = [];

  // 1. Try Ola Maps first
  if (apiKey) {
    try {
      let url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${apiKey}`;
      if (location) {
        url += `&location=${location}&radius=50000`;
      }
      if (type === 'restaurant') {
        url += '&types=establishment';
      }

      const res = await fetch(url);
      const data = await res.json();
      predictions = data?.predictions || [];
    } catch {
      // Ola failed – will fallback to Nominatim
    }
  }

  // 2. If Ola gave no results, fallback to free Nominatim (OpenStreetMap)
  if (predictions.length === 0) {
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`;
      const nominatimRes = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'Delivo/1.0 (nishantiguess@gmail.com)' }
      });
      const nominatimData = await nominatimRes.json();

      // Convert Nominatim results to match the prediction format used by the frontend
      predictions = nominatimData.map((item: any) => ({
        description: item.display_name,
        geometry: {
          location: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
          }
        }
      }));
    } catch {
      // Both failed – return empty
    }
  }

  // Return in a uniform structure that the frontend expects
  return NextResponse.json({ predictions });
}
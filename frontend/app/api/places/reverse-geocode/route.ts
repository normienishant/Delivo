import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const latlng = req.nextUrl.searchParams.get('latlng');
  if (!latlng) {
    return NextResponse.json({ error: 'latlng required' }, { status: 400 });
  }

  const apiKey = process.env.OLA_API_KEY;

  // Try Ola Maps reverse geocode first
  if (apiKey) {
    try {
      const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${latlng}&api_key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      // Ola might return results differently; adjust if needed
      if (data?.results?.length > 0) {
        return NextResponse.json(data);
      }
    } catch {
      // Ola failed – fallback to free Nominatim
    }
  }

  // Free fallback – OpenStreetMap Nominatim
  const [lat, lng] = latlng.split(',');
  try {
    const fallbackUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=en`;
    const fbRes = await fetch(fallbackUrl, {
      headers: { 'User-Agent': 'Delivo/1.0 (nishantiguess@gmail.com)' }
    });
    const fbData = await fbRes.json();
    // Nominatim returns { display_name: "..." } directly
    return NextResponse.json({
      results: [
        {
          formatted_address: fbData.display_name,
          name: fbData.name,
        },
      ],
    });
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
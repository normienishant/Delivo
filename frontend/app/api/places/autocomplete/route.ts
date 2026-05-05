import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') || '';
  const type = req.nextUrl.searchParams.get('type') || 'address';
  
  if (query.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.OLA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const location = req.nextUrl.searchParams.get('location') || '';

  try {
    let url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(query)}&api_key=${apiKey}`;
if (location) {
  url += `&location=${location}&radius=50000`;
}
    // ✅ If searching for a restaurant, filter to establishments/businesses
    if (type === 'restaurant') {
      // Ola Maps typically uses &types=establishment to filter businesses
      url += '&types=establishment';
    }

    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
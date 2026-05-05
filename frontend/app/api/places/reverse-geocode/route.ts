import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const latlng = req.nextUrl.searchParams.get('latlng');
  if (!latlng) {
    return NextResponse.json({ error: 'latlng required' }, { status: 400 });
  }

  const apiKey = process.env.OLA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  try {
    const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${latlng}&api_key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
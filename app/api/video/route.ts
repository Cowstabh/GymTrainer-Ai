import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error: Missing YouTube API key' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " perfect form tutorial")}&key=${apiKey}&type=video&maxResults=1`);
    const data = await res.json();

    if (!res.ok) {
      console.error('YouTube API Error:', data);
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: res.status });
    }

    const videoId = data.items?.[0]?.id?.videoId;
    if (!videoId) {
      return NextResponse.json({ error: 'No video found' }, { status: 404 });
    }

    return NextResponse.json({ videoId });
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

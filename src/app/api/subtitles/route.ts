// src/app/api/subtitles/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const imdbId = request.nextUrl.searchParams.get("imdbId");
  if (!imdbId) {
    return Response.json({ error: "Missing query parameter 'imdbId'" }, { status: 400 });
  }

  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OpenSubtitles API key not configured" }, { status: 500 });
  }

  // Step 1: Search for subtitles by IMDB ID
  const searchRes = await fetch(
    `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=en&order_by=download_count&order_direction=desc`,
    {
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "FBombTracker v1.0",
      },
    }
  );

  if (!searchRes.ok) {
    return Response.json({ error: "OpenSubtitles search failed" }, { status: searchRes.status });
  }

  const searchData = await searchRes.json();

  if (!searchData.data || searchData.data.length === 0) {
    return Response.json({ error: "No subtitles found for this movie" }, { status: 404 });
  }

  const fileId = searchData.data[0].attributes.files[0]?.file_id;
  if (!fileId) {
    return Response.json({ error: "No subtitle file available" }, { status: 404 });
  }

  // Step 2: Request download link
  const downloadRes = await fetch(
    "https://api.opensubtitles.com/api/v1/download",
    {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "FBombTracker v1.0",
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );

  const downloadText = await downloadRes.text();

  if (!downloadRes.ok) {
    console.error("OpenSubtitles download error:", downloadRes.status, downloadText.substring(0, 200));
    return Response.json({ error: "Failed to get download link" }, { status: downloadRes.status });
  }

  let downloadData;
  try {
    downloadData = JSON.parse(downloadText);
  } catch {
    console.error("OpenSubtitles returned non-JSON:", downloadText.substring(0, 200));
    return Response.json({ error: "Unexpected response from OpenSubtitles" }, { status: 502 });
  }

  const downloadUrl = downloadData.link;
  if (!downloadUrl) {
    return Response.json({ error: "No download URL returned" }, { status: 500 });
  }

  // Step 3: Fetch the actual subtitle content
  const srtRes = await fetch(downloadUrl);
  if (!srtRes.ok) {
    return Response.json({ error: "Failed to download subtitle file" }, { status: srtRes.status });
  }

  const srtText = await srtRes.text();

  return new Response(srtText, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

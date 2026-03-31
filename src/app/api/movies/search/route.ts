// src/app/api/movies/search/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return Response.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;

  let data;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return Response.json({ error: "TMDB API error" }, { status: res.status });
    }
    data = await res.json();
  } catch {
    return Response.json({ error: "Failed to reach TMDB" }, { status: 502 });
  }

  // Fetch details + external IDs in a single call per movie using append_to_response
  // Limit to 5 results to avoid rate limiting
  const movies = [];
  for (const m of data.results.slice(0, 5)) {
    try {
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/movie/${m.id}?api_key=${apiKey}&append_to_response=external_ids`
      );
      if (!detailRes.ok) continue;
      const detail = await detailRes.json();

      const imdbId = detail.external_ids?.imdb_id;
      if (!imdbId) continue;

      movies.push({
        id: m.id,
        title: m.title,
        year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
        posterUrl: m.poster_path
          ? `https://image.tmdb.org/t/p/w200${m.poster_path}`
          : null,
        imdbId,
        runtime: detail.runtime || null,
      });
    } catch {
      continue;
    }
  }

  return Response.json(movies);
}

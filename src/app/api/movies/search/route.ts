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

  const res = await fetch(url);
  if (!res.ok) {
    return Response.json({ error: "TMDB API error" }, { status: res.status });
  }

  const data = await res.json();

  const movies = await Promise.all(
    data.results.slice(0, 10).map(async (m: any) => {
      // Fetch external IDs to get IMDB ID
      const extRes = await fetch(
        `https://api.themoviedb.org/3/movie/${m.id}/external_ids?api_key=${apiKey}`
      );
      const extData = extRes.ok ? await extRes.json() : {};

      // Fetch details for runtime
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/movie/${m.id}?api_key=${apiKey}`
      );
      const detailData = detailRes.ok ? await detailRes.json() : {};

      return {
        id: m.id,
        title: m.title,
        year: m.release_date ? parseInt(m.release_date.substring(0, 4)) : null,
        posterUrl: m.poster_path
          ? `https://image.tmdb.org/t/p/w200${m.poster_path}`
          : null,
        imdbId: extData.imdb_id || null,
        runtime: detailData.runtime || null,
      };
    })
  );

  return Response.json(movies.filter((m: any) => m.imdbId));
}

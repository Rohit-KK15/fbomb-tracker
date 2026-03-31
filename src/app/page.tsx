"use client";

import { useState, useMemo } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MovieChips from "./components/MovieChips";
import Chart from "./components/Chart";
import PlayControls from "./components/PlayControls";
import StatsCards from "./components/StatsCards";
import type { Movie, MovieChartData } from "@/lib/types";
import { parseSrt, extractFBombs } from "@/lib/srt-parser";
import { buildCumulativeData, computeStats } from "@/lib/chart-math";
import { useAnimation } from "@/hooks/useAnimation";

export default function Home() {
  const [movies, setMovies] = useState<MovieChartData[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const maxTime = useMemo(
    () => Math.max(...movies.map((m) => m.movie.runtime || 120), 60),
    [movies]
  );

  const animation = useAnimation({ duration: 8000 });

  async function handleMovieSelect(movie: Movie) {
    if (movies.length >= 3) return;
    if (movies.some((m) => m.movie.id === movie.id)) return;

    setLoading(movie.title);
    try {
      const res = await fetch(`/api/subtitles?imdbId=${movie.imdbId}`);
      if (!res.ok) {
        alert(`Could not find subtitles for "${movie.title}"`);
        return;
      }
      const srtText = await res.text();
      const subtitles = parseSrt(srtText);
      const entries = extractFBombs(subtitles);
      const cumulative = buildCumulativeData(entries);
      const stats = computeStats(entries, movie.runtime);

      setMovies((prev) => [...prev, { movie, entries, cumulative, stats }]);
      animation.reset();
    } finally {
      setLoading(null);
    }
  }

  function handleRemoveMovie(movieId: number) {
    setMovies((prev) => prev.filter((m) => m.movie.id !== movieId));
    animation.reset();
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4">
      <Header />
      <SearchBar onSelect={handleMovieSelect} disabled={movies.length >= 3} />
      <MovieChips movies={movies} onRemove={handleRemoveMovie} />
      {loading && (
        <p className="text-center text-sm text-[var(--text-muted)] py-4">
          Loading subtitles for {loading}...
        </p>
      )}
      {movies.length > 0 && (
        <>
          <Chart movies={movies} progress={animation.progress} />
          <PlayControls
            isPlaying={animation.isPlaying}
            progress={animation.progress}
            maxTimeMinutes={maxTime}
            onPlay={animation.play}
            onPause={animation.pause}
            onSeek={animation.seek}
          />
          <StatsCards movies={movies} />
        </>
      )}
    </main>
  );
}

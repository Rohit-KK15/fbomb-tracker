"use client";

import { useState, useMemo, useCallback } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MovieChips from "./components/MovieChips";
import Chart from "./components/Chart";
import PlayControls from "./components/PlayControls";
import StatsCards from "./components/StatsCards";
import type { Movie, MovieChartData, MovieChartView, WordType, CumulativePoint } from "@/lib/types";
import { parseSrt, extractFBombs, extractNWords } from "@/lib/srt-parser";
import { buildCumulativeData, computeStats } from "@/lib/chart-math";
import { useAnimation } from "@/hooks/useAnimation";

function getCountAtTime(cumulative: CumulativePoint[], timeMinutes: number): number {
  let count = 0;
  for (const p of cumulative) {
    if (p.timeMinutes > timeMinutes) break;
    count = p.count;
  }
  return count;
}

export default function Home() {
  const [movies, setMovies] = useState<MovieChartData[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [wordType, setWordType] = useState<WordType>("f-word");

  const maxTime = useMemo(
    () => Math.max(...movies.map((m) => m.movie.runtime || 120), 60),
    [movies]
  );

  // Derive chart-ready data from the selected word type
  const chartMovies: MovieChartView[] = useMemo(
    () =>
      movies.map((m) => ({
        movie: m.movie,
        entries: wordType === "f-word" ? m.fEntries : m.nEntries,
        cumulative: wordType === "f-word" ? m.fCumulative : m.nCumulative,
        stats: wordType === "f-word" ? m.fStats : m.nStats,
      })),
    [movies, wordType]
  );

  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const animation = useAnimation({ duration: 8000 });

  const handleChartHover = useCallback((time: number | null) => {
    setHoverTime(time);
  }, []);

  const hoverProgress = useMemo(
    () => (hoverTime !== null ? hoverTime / maxTime : null),
    [hoverTime, maxTime]
  );

  const hoverCounts = useMemo(() => {
    if (hoverTime === null) return null;
    return chartMovies.map((m) => getCountAtTime(m.cumulative, hoverTime));
  }, [hoverTime, chartMovies]);

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

      const fEntries = extractFBombs(subtitles);
      const nEntries = extractNWords(subtitles);

      setMovies((prev) => [
        ...prev,
        {
          movie,
          fEntries,
          nEntries,
          fCumulative: buildCumulativeData(fEntries, movie.runtime),
          nCumulative: buildCumulativeData(nEntries, movie.runtime),
          fStats: computeStats(fEntries, movie.runtime),
          nStats: computeStats(nEntries, movie.runtime),
        },
      ]);
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
          <div className="flex justify-center mb-3">
            <div className="inline-flex bg-[var(--bg-card)] border border-[var(--border)] rounded-full p-1">
              <button
                onClick={() => { setWordType("f-word"); animation.reset(); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  wordType === "f-word"
                    ? "bg-[var(--accent-pink)] text-[#0a0a0f]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                F-Word
              </button>
              <button
                onClick={() => { setWordType("n-word"); animation.reset(); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  wordType === "n-word"
                    ? "bg-[var(--accent-pink)] text-[#0a0a0f]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                N-Word
              </button>
            </div>
          </div>
          <Chart movies={chartMovies} progress={animation.progress} onHover={handleChartHover} />
          <PlayControls
            isPlaying={animation.isPlaying}
            progress={animation.progress}
            maxTimeMinutes={maxTime}
            hoverProgress={hoverProgress}
            onPlay={animation.play}
            onPause={animation.pause}
            onSeek={animation.seek}
          />
          <StatsCards movies={chartMovies} hoverCounts={hoverCounts} />
        </>
      )}
    </main>
  );
}

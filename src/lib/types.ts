// src/lib/types.ts

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl: string | null;
  imdbId: string;
  runtime: number; // minutes
}

export interface FBombEntry {
  timeMinutes: number;
  text: string;
}

export interface MovieChartData {
  movie: Movie;
  entries: FBombEntry[];
  cumulative: CumulativePoint[];
  stats: MovieStats;
}

export interface CumulativePoint {
  timeMinutes: number;
  count: number;
}

export interface MovieStats {
  total: number;
  perMinute: number;
  peakWindow: { startMinute: number; endMinute: number; count: number };
}

export const MOVIE_COLORS = ["#ff2d78", "#00e5ff", "#8cff32"] as const;

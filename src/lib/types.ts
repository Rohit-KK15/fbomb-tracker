// src/lib/types.ts

export type WordType = "f-word" | "n-word";

export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl: string | null;
  imdbId: string;
  runtime: number; // minutes
}

export interface WordEntry {
  timeMinutes: number;
  text: string;
}

/** @deprecated Use WordEntry instead */
export type FBombEntry = WordEntry;

export interface MovieChartData {
  movie: Movie;
  fEntries: WordEntry[];
  nEntries: WordEntry[];
  fCumulative: CumulativePoint[];
  nCumulative: CumulativePoint[];
  fStats: MovieStats;
  nStats: MovieStats;
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

/** View type for chart/stats — has the active word type's data only */
export interface MovieChartView {
  movie: Movie;
  entries: WordEntry[];
  cumulative: CumulativePoint[];
  stats: MovieStats;
}

export const MOVIE_COLORS = ["#ff2d78", "#00e5ff", "#8cff32"] as const;

# F-Bomb Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app that visualizes cumulative f-word usage in movies over time using animated line graphs, with movie poster bubbles at line heads and playback controls.

**Architecture:** Next.js App Router with two thin API route proxies (TMDB for movie search, OpenSubtitles for subtitle fetching). All SRT parsing and chart data computation happens client-side. Custom SVG-based animated chart with bezier curves.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Custom SVG animation with requestAnimationFrame

---

## File Structure

```
fbomb-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, fonts, metadata
│   │   ├── page.tsx                # Main page composing all components
│   │   ├── globals.css             # Tailwind imports + custom CSS vars
│   │   ├── api/
│   │   │   ├── movies/
│   │   │   │   └── search/
│   │   │   │       └── route.ts    # TMDB proxy
│   │   │   └── subtitles/
│   │   │       └── route.ts        # OpenSubtitles proxy
│   │   └── components/
│   │       ├── Header.tsx           # Title + tagline
│   │       ├── SearchBar.tsx        # Movie search with autocomplete
│   │       ├── MovieChips.tsx       # Selected movie tags
│   │       ├── Chart.tsx            # SVG animated line chart
│   │       ├── PlayControls.tsx     # Play/pause + scrubber
│   │       └── StatsCards.tsx       # Per-movie stat cards
│   ├── lib/
│   │   ├── srt-parser.ts           # SRT text → f-word timeline data
│   │   ├── chart-math.ts           # Bezier interpolation + cumulative data
│   │   └── types.ts                # Shared TypeScript types
│   └── hooks/
│       └── useAnimation.ts         # requestAnimationFrame hook for playback
├── __tests__/
│   ├── srt-parser.test.ts
│   └── chart-math.test.ts
├── .env.local                      # API keys (not committed)
├── .env.example                    # Template for required env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.env.example`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /Users/rohitkk/Personal\ Projects/fbomb-tracker
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

Select defaults when prompted. This overwrites the existing directory with a fresh Next.js scaffold.

- [ ] **Step 2: Create .env.example**

```env
# Get your API key at https://www.themoviedb.org/settings/api
TMDB_API_KEY=

# Get your API key at https://www.opensubtitles.com/en/consumers
OPENSUBTITLES_API_KEY=
```

- [ ] **Step 3: Create .env.local with actual keys**

```env
TMDB_API_KEY=<your-key>
OPENSUBTITLES_API_KEY=<your-key>
```

Note: The user must register at TMDB and OpenSubtitles to get API keys. This file is gitignored.

- [ ] **Step 4: Set up globals.css with theme colors**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --bg-primary: #0a0a0f;
  --bg-card: #0e0e16;
  --bg-input: #111118;
  --border: #1a1a24;
  --text-primary: #ffffff;
  --text-muted: #555555;
  --text-dim: #333333;
  --accent-pink: #ff2d78;
  --accent-blue: #00e5ff;
  --accent-green: #8cff32;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

- [ ] **Step 5: Set up root layout**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "F-Bomb Tracker",
  description: "How many f***s does your favorite movie give?",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Stub out page.tsx**

Replace `src/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold">F-Bomb Tracker</h1>
    </main>
  );
}
```

- [ ] **Step 7: Verify dev server runs**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npm run dev`

Expected: Server starts at localhost:3000, shows "F-Bomb Tracker" text on dark background.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and theme"
```

---

### Task 2: Shared Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define all shared types**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 3: SRT Parser with Tests

**Files:**
- Create: `src/lib/srt-parser.ts`, `__tests__/srt-parser.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/srt-parser.test.ts
import { parseSrt, extractFBombs } from "../src/lib/srt-parser";

const SAMPLE_SRT = `1
00:01:15,000 --> 00:01:17,500
What the fuck are you doing?

2
00:02:30,200 --> 00:02:32,800
That's a nice day.

3
00:05:00,000 --> 00:05:03,000
I don't give a fuck. Fucking hell.

4
00:10:00,000 --> 00:10:02,000
You motherfucker!`;

describe("parseSrt", () => {
  it("parses SRT text into subtitle entries", () => {
    const entries = parseSrt(SAMPLE_SRT);
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({
      startTime: "00:01:15,000",
      endTime: "00:01:17,500",
      text: "What the fuck are you doing?",
    });
  });

  it("handles empty input", () => {
    expect(parseSrt("")).toEqual([]);
  });

  it("handles malformed blocks gracefully", () => {
    const malformed = `1
00:01:00,000 --> 00:01:02,000
Hello

garbage line without timestamp

2
00:02:00,000 --> 00:02:02,000
World`;
    const entries = parseSrt(malformed);
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });
});

describe("extractFBombs", () => {
  it("finds all f-word occurrences with timestamps", () => {
    const entries = parseSrt(SAMPLE_SRT);
    const fbombs = extractFBombs(entries);
    // Block 1: "fuck" (1 match), Block 3: "fuck" + "Fucking" (2 matches), Block 4: "motherfucker" (1 match)
    expect(fbombs).toHaveLength(4);
  });

  it("converts timestamps to minutes", () => {
    const entries = parseSrt(SAMPLE_SRT);
    const fbombs = extractFBombs(entries);
    expect(fbombs[0].timeMinutes).toBeCloseTo(1.25, 2);
  });

  it("is case insensitive", () => {
    const srt = `1
00:00:10,000 --> 00:00:12,000
FUCK THIS. Fuck that. fuck everything.`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(3);
  });

  it("matches fookin variant", () => {
    const srt = `1
00:00:05,000 --> 00:00:07,000
You fookin wot mate?`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(1);
  });

  it("does not match non-f-words", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Let's have fun at the duck pond.`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npx jest __tests__/srt-parser.test.ts --no-cache 2>&1 | head -30`

If jest is not set up, first install: `npm install -D jest ts-jest @types/jest` and create `jest.config.ts`:

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js"],
};

export default config;
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement SRT parser**

```typescript
// src/lib/srt-parser.ts

export interface SubtitleEntry {
  startTime: string;
  endTime: string;
  text: string;
}

interface FBombEntry {
  timeMinutes: number;
  text: string;
}

const TIMESTAMP_RE = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/;
const FBOMB_RE = /\bf(u|oo)ck/gi;

export function parseSrt(srt: string): SubtitleEntry[] {
  if (!srt.trim()) return [];

  const blocks = srt.trim().replace(/\r\n/g, "\n").split(/\n\n+/);
  const entries: SubtitleEntry[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    let timestampLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (TIMESTAMP_RE.test(lines[i])) {
        timestampLine = i;
        break;
      }
    }

    if (timestampLine === -1) continue;

    const match = lines[timestampLine].match(TIMESTAMP_RE)!;
    const text = lines.slice(timestampLine + 1).join(" ").trim();

    if (text) {
      entries.push({ startTime: match[1], endTime: match[2], text });
    }
  }

  return entries;
}

function timestampToMinutes(ts: string): number {
  const [h, m, sAndMs] = ts.split(":");
  const [s, ms] = sAndMs.split(",");
  return parseInt(h) * 60 + parseInt(m) + parseInt(s) / 60 + parseInt(ms) / 60000;
}

export function extractFBombs(entries: SubtitleEntry[]): FBombEntry[] {
  const results: FBombEntry[] = [];

  for (const entry of entries) {
    const matches = entry.text.match(FBOMB_RE);
    if (matches) {
      const timeMinutes = timestampToMinutes(entry.startTime);
      for (const match of matches) {
        results.push({ timeMinutes, text: entry.text });
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npx jest __tests__/srt-parser.test.ts --no-cache`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/srt-parser.ts __tests__/srt-parser.test.ts jest.config.ts
git commit -m "feat: SRT parser with f-word extraction and tests"
```

---

### Task 4: Chart Math Utilities with Tests

**Files:**
- Create: `src/lib/chart-math.ts`, `__tests__/chart-math.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/chart-math.test.ts
import {
  buildCumulativeData,
  computeStats,
  interpolateBezierPath,
} from "../src/lib/chart-math";
import type { FBombEntry } from "../src/lib/types";

describe("buildCumulativeData", () => {
  it("builds cumulative count from f-bomb entries", () => {
    const entries: FBombEntry[] = [
      { timeMinutes: 1, text: "fuck" },
      { timeMinutes: 5, text: "fuck" },
      { timeMinutes: 5, text: "fucking" },
      { timeMinutes: 10, text: "fuck" },
    ];
    const result = buildCumulativeData(entries);
    expect(result).toEqual([
      { timeMinutes: 1, count: 1 },
      { timeMinutes: 5, count: 2 },
      { timeMinutes: 5, count: 3 },
      { timeMinutes: 10, count: 4 },
    ]);
  });

  it("returns starting point for empty entries", () => {
    expect(buildCumulativeData([])).toEqual([{ timeMinutes: 0, count: 0 }]);
  });
});

describe("computeStats", () => {
  it("computes total, perMinute, and peak window", () => {
    const entries: FBombEntry[] = [
      { timeMinutes: 1, text: "a" },
      { timeMinutes: 2, text: "b" },
      { timeMinutes: 2.5, text: "c" },
      { timeMinutes: 3, text: "d" },
      { timeMinutes: 20, text: "e" },
    ];
    const stats = computeStats(entries, 120);
    expect(stats.total).toBe(5);
    expect(stats.perMinute).toBeCloseTo(0.042, 2);
    expect(stats.peakWindow.startMinute).toBeLessThanOrEqual(2);
    expect(stats.peakWindow.count).toBeGreaterThanOrEqual(3);
  });
});

describe("interpolateBezierPath", () => {
  it("returns an SVG path string with smooth curves", () => {
    const points = [
      { timeMinutes: 0, count: 0 },
      { timeMinutes: 5, count: 3 },
      { timeMinutes: 10, count: 7 },
    ];
    const path = interpolateBezierPath(points, 600, 300, 10, 10);
    expect(path).toMatch(/^M/);
    expect(path).toContain("C");
  });

  it("handles single point", () => {
    const points = [{ timeMinutes: 0, count: 0 }];
    const path = interpolateBezierPath(points, 600, 300, 10, 10);
    expect(path).toMatch(/^M/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npx jest __tests__/chart-math.test.ts --no-cache`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement chart math**

```typescript
// src/lib/chart-math.ts
import type { FBombEntry, CumulativePoint, MovieStats } from "./types";

export function buildCumulativeData(entries: FBombEntry[]): CumulativePoint[] {
  if (entries.length === 0) return [{ timeMinutes: 0, count: 0 }];

  let count = 0;
  return entries.map((e) => ({ timeMinutes: e.timeMinutes, count: ++count }));
}

export function computeStats(entries: FBombEntry[], runtimeMinutes: number): MovieStats {
  const total = entries.length;
  const perMinute = runtimeMinutes > 0 ? total / runtimeMinutes : 0;

  // Find densest 5-minute window
  let peakCount = 0;
  let peakStart = 0;

  for (let start = 0; start <= runtimeMinutes - 5; start += 0.5) {
    const end = start + 5;
    const count = entries.filter(
      (e) => e.timeMinutes >= start && e.timeMinutes < end
    ).length;
    if (count > peakCount) {
      peakCount = count;
      peakStart = start;
    }
  }

  return {
    total,
    perMinute: Math.round(perMinute * 1000) / 1000,
    peakWindow: {
      startMinute: Math.floor(peakStart),
      endMinute: Math.ceil(peakStart + 5),
      count: peakCount,
    },
  };
}

export function interpolateBezierPath(
  points: CumulativePoint[],
  width: number,
  height: number,
  maxTime: number,
  maxCount: number
): string {
  if (points.length === 0) return "";

  const scaleX = (t: number) => (t / maxTime) * width;
  const scaleY = (c: number) => height - (c / maxCount) * height;

  if (points.length === 1) {
    return `M${scaleX(points[0].timeMinutes)},${scaleY(points[0].count)}`;
  }

  let path = `M${scaleX(points[0].timeMinutes)},${scaleY(points[0].count)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const px = scaleX(prev.timeMinutes);
    const py = scaleY(prev.count);
    const cx = scaleX(curr.timeMinutes);
    const cy = scaleY(curr.count);
    const midX = (px + cx) / 2;

    path += ` C${midX},${py} ${midX},${cy} ${cx},${cy}`;
  }

  return path;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npx jest __tests__/chart-math.test.ts --no-cache`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chart-math.ts __tests__/chart-math.test.ts
git commit -m "feat: chart math utilities with bezier interpolation and tests"
```

---

### Task 5: TMDB Movie Search API Route

**Files:**
- Create: `src/app/api/movies/search/route.ts`

- [ ] **Step 1: Implement the TMDB proxy route**

```typescript
// src/app/api/movies/search/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "TMDB API error" }, { status: res.status });
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

  return NextResponse.json(movies.filter((m: any) => m.imdbId));
}
```

- [ ] **Step 2: Test manually**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npm run dev`

Then in another terminal:
```bash
curl "http://localhost:3000/api/movies/search?q=pulp+fiction" | jq .
```

Expected: JSON array with movie objects containing `id`, `title`, `year`, `posterUrl`, `imdbId`, `runtime`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/movies/search/route.ts
git commit -m "feat: TMDB movie search API route"
```

---

### Task 6: OpenSubtitles API Route

**Files:**
- Create: `src/app/api/subtitles/route.ts`

- [ ] **Step 1: Implement the OpenSubtitles proxy route**

```typescript
// src/app/api/subtitles/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const imdbId = request.nextUrl.searchParams.get("imdbId");
  if (!imdbId) {
    return NextResponse.json({ error: "Missing query parameter 'imdbId'" }, { status: 400 });
  }

  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenSubtitles API key not configured" }, { status: 500 });
  }

  // Step 1: Search for subtitles by IMDB ID
  const searchRes = await fetch(
    `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId}&languages=en&order_by=download_count&order_direction=desc`,
    {
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchRes.ok) {
    return NextResponse.json({ error: "OpenSubtitles search failed" }, { status: searchRes.status });
  }

  const searchData = await searchRes.json();

  if (!searchData.data || searchData.data.length === 0) {
    return NextResponse.json({ error: "No subtitles found for this movie" }, { status: 404 });
  }

  const fileId = searchData.data[0].attributes.files[0]?.file_id;
  if (!fileId) {
    return NextResponse.json({ error: "No subtitle file available" }, { status: 404 });
  }

  // Step 2: Request download link
  const downloadRes = await fetch(
    "https://api.opensubtitles.com/api/v1/download",
    {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
    }
  );

  if (!downloadRes.ok) {
    return NextResponse.json({ error: "Failed to get download link" }, { status: downloadRes.status });
  }

  const downloadData = await downloadRes.json();
  const downloadUrl = downloadData.link;

  if (!downloadUrl) {
    return NextResponse.json({ error: "No download URL returned" }, { status: 500 });
  }

  // Step 3: Fetch the actual subtitle content
  const srtRes = await fetch(downloadUrl);
  if (!srtRes.ok) {
    return NextResponse.json({ error: "Failed to download subtitle file" }, { status: srtRes.status });
  }

  const srtText = await srtRes.text();

  return new NextResponse(srtText, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

- [ ] **Step 2: Test manually**

With dev server running:
```bash
curl "http://localhost:3000/api/subtitles?imdbId=tt0110912"
```

Expected: Raw SRT text content for Pulp Fiction.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/subtitles/route.ts
git commit -m "feat: OpenSubtitles proxy API route"
```

---

### Task 7: Header Component

**Files:**
- Create: `src/app/components/Header.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the Header component**

```tsx
// src/app/components/Header.tsx
export default function Header() {
  return (
    <header className="text-center pt-12 pb-4 px-5">
      <p className="text-xs tracking-[4px] uppercase text-[var(--accent-pink)] mb-2">
        every f*ck, mapped
      </p>
      <h1 className="text-5xl font-extrabold tracking-tight">F-Bomb Tracker</h1>
      <p className="text-[var(--text-muted)] mt-2 text-sm">
        Search a movie. Watch the f-bombs pile up.
      </p>
    </header>
  );
}
```

- [ ] **Step 2: Add Header to page.tsx**

Replace `src/app/page.tsx` with:

```tsx
import Header from "./components/Header";

export default function Home() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4">
      <Header />
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

Run dev server, check localhost:3000. Should show the styled header with subtitle, title, and tagline on dark background.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/Header.tsx src/app/page.tsx
git commit -m "feat: Header component with title and tagline"
```

---

### Task 8: SearchBar Component

**Files:**
- Create: `src/app/components/SearchBar.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the SearchBar component**

```tsx
// src/app/components/SearchBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { Movie } from "@/lib/types";

interface Props {
  onSelect: (movie: Movie) => void;
  disabled: boolean;
}

export default function SearchBar({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data: Movie[] = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(movie: Movie) {
    onSelect(movie);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative max-w-[460px] mx-auto my-6 px-5">
      <div className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-5 py-3.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={disabled ? "Max 3 movies selected" : "Search a movie..."}
          disabled={disabled}
          className="bg-transparent outline-none text-sm text-white placeholder:text-[var(--text-muted)] w-full"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-5 right-5 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden z-50">
          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleSelect(movie)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--border)] transition-colors text-left"
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt=""
                  className="w-8 h-12 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-12 rounded bg-[var(--border)]" />
              )}
              <div>
                <div className="text-sm font-medium">{movie.title}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {movie.year} {movie.runtime ? `· ${movie.runtime}m` : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire up page.tsx with state management**

Replace `src/app/page.tsx` with:

```tsx
"use client";

import { useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import type { Movie, MovieChartData } from "@/lib/types";
import { parseSrt, extractFBombs } from "@/lib/srt-parser";
import { buildCumulativeData, computeStats } from "@/lib/chart-math";

export default function Home() {
  const [movies, setMovies] = useState<MovieChartData[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

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
    } finally {
      setLoading(null);
    }
  }

  function handleRemoveMovie(movieId: number) {
    setMovies((prev) => prev.filter((m) => m.movie.id !== movieId));
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-4">
      <Header />
      <SearchBar onSelect={handleMovieSelect} disabled={movies.length >= 3} />
      {loading && (
        <p className="text-center text-sm text-[var(--text-muted)]">
          Loading subtitles for {loading}...
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify in browser**

Search for a movie. Autocomplete dropdown should appear with poster thumbnails. Selecting a movie should trigger subtitle fetch (check network tab).

- [ ] **Step 4: Commit**

```bash
git add src/app/components/SearchBar.tsx src/app/page.tsx
git commit -m "feat: SearchBar with autocomplete and subtitle fetching"
```

---

### Task 9: MovieChips Component

**Files:**
- Create: `src/app/components/MovieChips.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the MovieChips component**

```tsx
// src/app/components/MovieChips.tsx
import type { MovieChartData } from "@/lib/types";
import { MOVIE_COLORS } from "@/lib/types";

interface Props {
  movies: MovieChartData[];
  onRemove: (movieId: number) => void;
}

export default function MovieChips({ movies, onRemove }: Props) {
  if (movies.length === 0) return null;

  return (
    <div className="flex gap-2 justify-center px-5 pb-4 flex-wrap">
      {movies.map((m, i) => (
        <span
          key={m.movie.id}
          className="flex items-center gap-2 rounded-full px-2 py-1.5 text-xs border"
          style={{
            color: MOVIE_COLORS[i],
            borderColor: MOVIE_COLORS[i] + "40",
            backgroundColor: MOVIE_COLORS[i] + "15",
          }}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
            style={{ backgroundColor: MOVIE_COLORS[i], color: "#0a0a0f" }}
          >
            {i + 1}
          </span>
          {m.movie.title}
          <button
            onClick={() => onRemove(m.movie.id)}
            className="opacity-40 hover:opacity-100 transition-opacity text-[0.7rem]"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add MovieChips to page.tsx**

Add import and render between SearchBar and loading message:

```tsx
import MovieChips from "./components/MovieChips";
```

Add after `<SearchBar ... />`:

```tsx
<MovieChips movies={movies} onRemove={handleRemoveMovie} />
```

- [ ] **Step 3: Verify in browser**

Add a movie — colored chip should appear. Click ✕ — chip should disappear.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/MovieChips.tsx src/app/page.tsx
git commit -m "feat: MovieChips component with colored tags"
```

---

### Task 10: Animated Chart Component

**Files:**
- Create: `src/app/components/Chart.tsx`, `src/hooks/useAnimation.ts`

- [ ] **Step 1: Build the animation hook**

```typescript
// src/hooks/useAnimation.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAnimationOptions {
  duration: number; // ms
  onComplete?: () => void;
}

export function useAnimation({ duration, onComplete }: UseAnimationOptions) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current * duration;
      }

      const elapsed = timestamp - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        onComplete?.();
      }
    },
    [duration, onComplete]
  );

  const play = useCallback(() => {
    if (progress >= 1) {
      pausedAtRef.current = 0;
      startTimeRef.current = null;
    }
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, progress]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = progress;
    startTimeRef.current = null;
    setIsPlaying(false);
  }, [progress]);

  const seek = useCallback(
    (p: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const clamped = Math.max(0, Math.min(1, p));
      setProgress(clamped);
      pausedAtRef.current = clamped;
      startTimeRef.current = null;
      if (isPlaying) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [isPlaying, animate]
  );

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setIsPlaying(false);
    pausedAtRef.current = 0;
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { progress, isPlaying, play, pause, seek, reset };
}
```

- [ ] **Step 2: Build the Chart component**

```tsx
// src/app/components/Chart.tsx
"use client";

import { useMemo } from "react";
import type { MovieChartData } from "@/lib/types";
import { MOVIE_COLORS } from "@/lib/types";
import { interpolateBezierPath } from "@/lib/chart-math";

interface Props {
  movies: MovieChartData[];
  progress: number; // 0-1
}

const CHART_W = 580;
const CHART_H = 240;
const PAD_L = 45;
const PAD_T = 10;
const PAD_B = 30;

export default function Chart({ movies, progress }: Props) {
  const maxTime = useMemo(
    () => Math.max(...movies.map((m) => m.movie.runtime || 120), 60),
    [movies]
  );
  const maxCount = useMemo(
    () => Math.max(...movies.map((m) => m.stats.total), 10),
    [movies]
  );

  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = PAD_T + (CHART_H / steps) * i;
      const label = Math.round(maxCount * (1 - i / steps));
      lines.push({ y, label });
    }
    return lines;
  }, [maxCount]);

  const timeLabels = useMemo(() => {
    const labels = [];
    const step = maxTime <= 60 ? 15 : 30;
    for (let t = 0; t <= maxTime; t += step) {
      const x = PAD_L + (t / maxTime) * CHART_W;
      labels.push({ x, label: `${t}m` });
    }
    return labels;
  }, [maxTime]);

  return (
    <div className="mx-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
      <svg
        viewBox={`0 0 ${PAD_L + CHART_W + 20} ${PAD_T + CHART_H + PAD_B + 20}`}
        className="w-full h-auto"
      >
        <defs>
          {movies.map((_, i) => (
            <linearGradient key={i} id={`glow-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOVIE_COLORS[i]} stopOpacity={0.15} />
              <stop offset="100%" stopColor={MOVIE_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Grid */}
        <line
          x1={PAD_L}
          y1={PAD_T + CHART_H}
          x2={PAD_L + CHART_W}
          y2={PAD_T + CHART_H}
          stroke="var(--border)"
        />
        {gridLines.map((g, i) => (
          <g key={i}>
            {i > 0 && (
              <line
                x1={PAD_L}
                y1={g.y}
                x2={PAD_L + CHART_W}
                y2={g.y}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2,6"
              />
            )}
            <text
              x={PAD_L - 6}
              y={g.y + 4}
              fill="var(--text-dim)"
              fontSize="10"
              textAnchor="end"
            >
              {g.label}
            </text>
          </g>
        ))}
        {timeLabels.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={PAD_T + CHART_H + 18}
            fill="var(--text-dim)"
            fontSize="10"
            textAnchor="middle"
          >
            {t.label}
          </text>
        ))}

        {/* Lines */}
        {movies.map((m, i) => {
          const visiblePoints = m.cumulative.filter(
            (p) => p.timeMinutes <= maxTime * progress
          );
          if (visiblePoints.length === 0) return null;

          const pathD = interpolateBezierPath(
            visiblePoints,
            CHART_W,
            CHART_H,
            maxTime,
            maxCount
          );

          // Translate to account for padding
          const lastPoint = visiblePoints[visiblePoints.length - 1];
          const headX =
            PAD_L + (lastPoint.timeMinutes / maxTime) * CHART_W;
          const headY =
            PAD_T + CHART_H - (lastPoint.count / maxCount) * CHART_H;

          return (
            <g key={m.movie.id} transform={`translate(${PAD_L},${PAD_T})`}>
              {/* Glow fill */}
              <path
                d={pathD + ` L${(lastPoint.timeMinutes / maxTime) * CHART_W},${CHART_H} L0,${CHART_H} Z`}
                fill={`url(#glow-${i})`}
              />
              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke={MOVIE_COLORS[i]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Poster bubble at head */}
              <g transform={`translate(${headX - PAD_L},${headY - PAD_T})`}>
                <circle r="18" fill="var(--bg-card)" stroke={MOVIE_COLORS[i]} strokeWidth="2.5" />
                {m.movie.posterUrl ? (
                  <>
                    <clipPath id={`poster-clip-${m.movie.id}`}>
                      <circle r="16" />
                    </clipPath>
                    <image
                      href={m.movie.posterUrl}
                      x="-16"
                      y="-16"
                      width="32"
                      height="32"
                      clipPath={`url(#poster-clip-${m.movie.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill={MOVIE_COLORS[i]}
                    fontSize="7"
                    fontWeight="700"
                  >
                    {m.movie.title.substring(0, 4)}
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/Chart.tsx src/hooks/useAnimation.ts
git commit -m "feat: animated Chart component with bezier curves and poster bubbles"
```

---

### Task 11: PlayControls Component

**Files:**
- Create: `src/app/components/PlayControls.tsx`

- [ ] **Step 1: Build the PlayControls component**

```tsx
// src/app/components/PlayControls.tsx
"use client";

interface Props {
  isPlaying: boolean;
  progress: number;
  maxTimeMinutes: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (progress: number) => void;
}

export default function PlayControls({
  isPlaying,
  progress,
  maxTimeMinutes,
  onPlay,
  onPause,
  onSeek,
}: Props) {
  const currentMinutes = Math.floor(progress * maxTimeMinutes);
  const currentSeconds = Math.floor((progress * maxTimeMinutes * 60) % 60);
  const timeStr = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}:${String(currentSeconds).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-center gap-4 mx-4 mt-3 px-4">
      <button
        onClick={isPlaying ? onPause : onPlay}
        className="w-9 h-9 rounded-full bg-[var(--accent-pink)] flex items-center justify-center hover:brightness-110 transition-all shrink-0"
      >
        {isPlaying ? (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="#0a0a0f">
            <rect x="1" y="0" width="3.5" height="14" rx="1" />
            <rect x="7.5" y="0" width="3.5" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0a0a0f">
            <polygon points="6,3 20,12 6,21" />
          </svg>
        )}
      </button>

      <div
        className="flex-1 max-w-[400px] h-1 bg-[var(--border)] rounded cursor-pointer relative"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          onSeek((e.clientX - rect.left) / rect.width);
        }}
      >
        <div
          className="h-full rounded"
          style={{
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, var(--accent-pink), #7b61ff)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"
          style={{ left: `${progress * 100}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>

      <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
        {timeStr}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/PlayControls.tsx
git commit -m "feat: PlayControls component with play/pause and scrubber"
```

---

### Task 12: StatsCards Component

**Files:**
- Create: `src/app/components/StatsCards.tsx`

- [ ] **Step 1: Build the StatsCards component**

```tsx
// src/app/components/StatsCards.tsx
import type { MovieChartData } from "@/lib/types";
import { MOVIE_COLORS } from "@/lib/types";

interface Props {
  movies: MovieChartData[];
}

export default function StatsCards({ movies }: Props) {
  if (movies.length === 0) return null;

  return (
    <div className="flex gap-3 px-5 pt-4 pb-8 overflow-x-auto">
      {movies.map((m, i) => (
        <div
          key={m.movie.id}
          className="flex-1 min-w-0 bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)]"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: MOVIE_COLORS[i] }}
            />
            <span
              className="text-[0.65rem] uppercase tracking-wider truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {m.movie.title}
            </span>
          </div>
          <div className="text-3xl font-extrabold leading-none">{m.stats.total}</div>
          <div className="flex gap-3 mt-2">
            <span className="text-[0.65rem] text-[var(--text-muted)]">
              {m.stats.perMinute.toFixed(2)}/min
            </span>
            <span className="text-[0.65rem]" style={{ color: MOVIE_COLORS[i] }}>
              Peak: {m.stats.peakWindow.startMinute}-{m.stats.peakWindow.endMinute}m
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/StatsCards.tsx
git commit -m "feat: StatsCards component with per-movie statistics"
```

---

### Task 13: Wire Everything Together

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Assemble all components in page.tsx**

Replace `src/app/page.tsx` with the final version:

```tsx
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
```

- [ ] **Step 2: Run the full app end-to-end**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npm run dev`

Test flow:
1. Search for "Wolf of Wall Street"
2. Select it — chart should appear with animated line and poster bubble
3. Click play — line should draw from left to right
4. Search for "Pulp Fiction" and add it — second line appears
5. Play animation — both lines animate together
6. Remove a movie — chip and line disappear
7. Check stats cards show correct data

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: wire all components together in main page"
```

---

### Task 14: Responsive Polish

**Files:**
- Modify: `src/app/components/StatsCards.tsx`, `src/app/globals.css`

- [ ] **Step 1: Add responsive breakpoints to StatsCards**

Update the outer div in `StatsCards.tsx`:

```tsx
<div className="flex flex-col sm:flex-row gap-3 px-5 pt-4 pb-8">
```

- [ ] **Step 2: Add smooth scrollbar styling to globals.css**

Append to `src/app/globals.css`:

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}
```

- [ ] **Step 3: Verify mobile layout**

Open browser dev tools, toggle device toolbar to iPhone or similar. Stats cards should stack vertically. Chart should remain full width. Search bar should be usable.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/StatsCards.tsx src/app/globals.css
git commit -m "feat: responsive layout and polish"
```

---

### Task 15: Build Verification and Deploy Prep

**Files:**
- Modify: `package.json` (if needed)

- [ ] **Step 1: Run all tests**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npx jest --no-cache`

Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `cd /Users/rohitkk/Personal\ Projects/fbomb-tracker && npm run build`

Expected: Build completes successfully with no errors.

- [ ] **Step 3: Test production build locally**

Run: `npm start`

Open localhost:3000 and verify full flow works.

- [ ] **Step 4: Push to GitHub**

```bash
cd /Users/rohitkk/Personal\ Projects/fbomb-tracker
git push origin main
```

- [ ] **Step 5: Deploy to Vercel**

Run: `npx vercel --prod`

Or connect the GitHub repo at vercel.com/new. Set environment variables `TMDB_API_KEY` and `OPENSUBTITLES_API_KEY` in Vercel dashboard.

- [ ] **Step 6: Verify deployed app**

Open the Vercel URL and test the full search → chart → play flow.

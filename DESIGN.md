# F-Bomb Tracker — Design Spec

## Overview

A fun, playful web app that visualizes how many times the f-word is used in a movie over its timeline. Users search for a movie, and the app fetches subtitles, parses them for f-words, and renders an animated cumulative line graph. Up to 3 movies can be compared side by side.

## Architecture

- **Framework:** Next.js (App Router)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS
- **Charting:** Custom canvas/SVG animation (smooth bezier curves with animated draw)
- **Subtitle source:** OpenSubtitles API (via thin API route proxy)
- **Movie metadata/posters:** TMDB API (for movie search results, posters, runtime)

### Data Flow

1. User types a movie name in the search bar
2. Client calls `/api/movies/search?q=<query>` — API route proxies to TMDB for movie search + poster URLs
3. User selects a movie from the dropdown (up to 3 total)
4. Client calls `/api/subtitles?imdbId=<id>` — API route proxies to OpenSubtitles, fetches .srt content
5. Client parses the .srt text: extracts every subtitle entry with a timestamp that contains an f-word (case-insensitive, handles variations like "fuck", "fucking", "fucked", "motherfucker", etc.)
6. Client builds cumulative count data: array of `{ timeMinutes: number, count: number }`
7. Chart renders with animation

### API Routes (thin proxies only)

- `GET /api/movies/search?q=<query>` — proxies TMDB search, returns `{ id, title, year, posterUrl, imdbId }`
- `GET /api/subtitles?imdbId=<id>` — proxies OpenSubtitles search + download, returns raw .srt text

No database. No auth. No server-side state.

## UI Design

### Vibe
- Fun and playful, tongue-in-cheek humor
- Dark cinematic theme (near-black background `#0a0a0f`)
- Bold accent colors: hot pink `#ff2d78`, electric blue `#00e5ff`, lime green `#8cff32`

### Layout (single page)

1. **Header**
   - Uppercase subtitle: "every f*ck, mapped"
   - Large bold title: "F-Bomb Tracker"
   - Tagline: "Search a movie. Watch the f-bombs pile up."

2. **Search bar**
   - Centered, pill-shaped input
   - Autocomplete dropdown showing movie name + year + small poster thumbnail
   - Selecting a movie adds it to the graph (max 3)

3. **Movie chips**
   - Horizontal row of selected movies as colored tags
   - Each chip shows a numbered circle (matching line color) + movie title + remove button
   - Colors assigned in order: pink, blue, green

4. **The Graph**
   - X-axis: movie timeline in minutes
   - Y-axis: cumulative f-word count
   - Smooth bezier curves (not jagged line segments)
   - Subtle gradient glow under each line
   - Minimal grid (dotted horizontal lines, solid baseline)
   - **Animated playback:** Lines draw from left to right, animating over the movie timeline
   - **Movie poster bubble:** Circle at the head of each line containing the movie's poster image, moves along the curve as it animates
   - **Play controls:** Play/pause button + scrubber bar + current timestamp display
   - Hover tooltip showing exact count and timestamp

5. **Stats cards**
   - Row of cards below the graph, one per selected movie
   - Each card shows: total f-word count (large), f-words per minute, peak 5-minute window
   - Color-coded to match the line

### Responsive Behavior
- On mobile: stats cards stack vertically, chart remains full-width
- Search bar and chips remain centered

## SRT Parsing Logic

The .srt format:
```
1
00:01:15,000 --> 00:01:17,500
What the fuck are you doing?

2
00:02:30,200 --> 00:02:32,800
I don't give a fuck.
```

Parsing steps:
1. Split by double newline to get subtitle blocks
2. For each block: extract the timestamp (start time) and the text
3. Convert timestamp to minutes (e.g., `00:01:15,000` → `1.25`)
4. Check if text contains f-word variants using regex: `/\bf(u|oo)ck/i` (covers fuck, fucking, fucked, fucker, motherfucker, fookin, etc.)
5. Build cumulative array: for each match, increment running count, record `{ time, count }`
6. If no subtitles found for a movie, show a friendly error message

## External APIs

### OpenSubtitles
- REST API with API key authentication
- Search by IMDB ID to find subtitle files
- Download subtitle file content
- Free tier: limited requests per day (sufficient for a side project)
- Requires account registration at opensubtitles.com

### TMDB (The Movie Database)
- Search movies by name, get poster URLs, IMDB ID, runtime
- Free API key with generous rate limits
- Provides high-quality poster images at various sizes

## Tech Stack Summary

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Chart | Custom SVG/Canvas with requestAnimationFrame |
| Movie data | TMDB API |
| Subtitles | OpenSubtitles API |
| Hosting | Vercel |

## Out of Scope

- User accounts / saving comparisons
- Movie rating or recommendation features
- Other profanity tracking (just f-words for now)
- Upload own .srt files (could add later)
- Backend database or caching layer

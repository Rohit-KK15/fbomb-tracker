// src/lib/chart-math.ts
import type { WordEntry, CumulativePoint, MovieStats } from "./types";

export function buildCumulativeData(
  entries: WordEntry[],
  runtimeMinutes?: number
): CumulativePoint[] {
  const runtime = runtimeMinutes || (entries.length > 0 ? entries[entries.length - 1].timeMinutes + 1 : 120);
  const points: CumulativePoint[] = [{ timeMinutes: 0, count: 0 }];

  let count = 0;
  for (const e of entries) {
    const lastTime = points[points.length - 1].timeMinutes;
    const gap = e.timeMinutes - lastTime;
    // Insert a hold point partway through the gap so the flat section
    // is clearly visible and the rise into the next f-bomb is smooth
    if (gap > 0.5) {
      points.push({ timeMinutes: e.timeMinutes - Math.min(gap * 0.3, 1.5), count });
    }
    count++;
    points.push({ timeMinutes: e.timeMinutes, count });
  }

  // Extend line to end of movie
  if (points[points.length - 1].timeMinutes < runtime) {
    points.push({ timeMinutes: runtime, count });
  }

  return points;
}

export function computeStats(entries: WordEntry[], runtimeMinutes: number): MovieStats {
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

/**
 * Monotone cubic interpolation — smooth curves that never overshoot
 * vertically, so flat sections stay flat and rises flow like a pulse monitor.
 */
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

  const n = points.length;
  const sx = points.map((p) => scaleX(p.timeMinutes));
  const sy = points.map((p) => scaleY(p.count));

  // Compute slopes using Fritsch-Carlson monotone method
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(sx[i + 1] - sx[i]);
    dy.push(sy[i + 1] - sy[i]);
    m.push(dx[i] === 0 ? 0 : dy[i] / dx[i]);
  }

  // Tangents at each point
  const tangents: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      // Sign change or zero — flat tangent (prevents overshoot)
      tangents.push(0);
    } else {
      tangents.push((m[i - 1] + m[i]) / 2);
    }
  }
  tangents.push(m[n - 2]);

  // Fritsch-Carlson adjustment to ensure monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / m[i];
      const beta = tangents[i + 1] / m[i];
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        tangents[i] = t * alpha * m[i];
        tangents[i + 1] = t * beta * m[i];
      }
    }
  }

  // Build cubic bezier path
  let path = `M${sx[0]},${sy[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const seg = dx[i] / 3;
    const cp1x = sx[i] + seg;
    const cp1y = sy[i] + tangents[i] * seg;
    const cp2x = sx[i + 1] - seg;
    const cp2y = sy[i + 1] - tangents[i + 1] * seg;
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${sx[i + 1]},${sy[i + 1]}`;
  }

  return path;
}

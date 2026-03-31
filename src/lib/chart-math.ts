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

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

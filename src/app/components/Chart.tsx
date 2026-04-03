"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import type { MovieChartView } from "@/lib/types";
import { MOVIE_COLORS } from "@/lib/types";
import { interpolateBezierPath } from "@/lib/chart-math";

interface Props {
  movies: MovieChartView[];
  progress: number; // 0-1
  onHover: (time: number | null) => void;
}

const CHART_W = 580;
const CHART_H = 240;
const PAD_L = 45;
const PAD_T = 30;
const PAD_R = 30;
const PAD_B = 30;

export default function Chart({ movies, progress, onHover }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ svgX: number; time: number } | null>(null);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const viewBoxW = PAD_L + CHART_W + PAD_R;
      const scaleX = viewBoxW / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;

      if (svgX < PAD_L || svgX > PAD_L + CHART_W) {
        setHover(null);
        onHover(null);
        return;
      }

      const time = ((svgX - PAD_L) / CHART_W) * maxTime;
      setHover({ svgX, time });
      onHover(time);
    },
    [maxTime, onHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHover(null);
    onHover(null);
  }, [onHover]);

  return (
    <div className="mx-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PAD_L + CHART_W + PAD_R} ${PAD_T + CHART_H + PAD_B}`}
        className="w-full h-auto cursor-crosshair"
        style={{ overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {movies.map((_, i) => (
            <linearGradient key={i} id={`glow-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOVIE_COLORS[i]} stopOpacity={0.15} />
              <stop offset="100%" stopColor={MOVIE_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
          {movies.map((_, i) => (
            <filter key={`blur-${i}`} id={`line-glow-${i}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
          const currentTime = maxTime * progress;
          const allVisible = m.cumulative.filter(
            (p) => p.timeMinutes <= currentTime
          );
          if (allVisible.length === 0) return null;

          const lastVisible = allVisible[allVisible.length - 1];
          if (lastVisible.timeMinutes < currentTime) {
            allVisible.push({ timeMinutes: currentTime, count: lastVisible.count });
          }

          // Full path (used for skeleton when hovering)
          const fullPathD = interpolateBezierPath(
            allVisible, CHART_W, CHART_H, maxTime, maxCount
          );

          // When hovering, split into active (up to cursor) and skeleton (rest)
          const hoverTime = hover?.time ?? null;
          const isHovering = hoverTime !== null && hoverTime <= currentTime;

          const activePoints = isHovering
            ? (() => {
                const pts = allVisible.filter((p) => p.timeMinutes <= hoverTime);
                if (pts.length > 0) {
                  const last = pts[pts.length - 1];
                  if (last.timeMinutes < hoverTime) {
                    pts.push({ timeMinutes: hoverTime, count: last.count });
                  }
                }
                return pts;
              })()
            : allVisible;

          const activePathD = isHovering
            ? interpolateBezierPath(activePoints, CHART_W, CHART_H, maxTime, maxCount)
            : fullPathD;

          const activeLastPoint = activePoints[activePoints.length - 1];
          const fullLastPoint = allVisible[allVisible.length - 1];

          // Poster bubble position — follows cursor when hovering
          const bubblePoint = isHovering ? activeLastPoint : fullLastPoint;
          const headX = PAD_L + (bubblePoint.timeMinutes / maxTime) * CHART_W;
          const headY = PAD_T + CHART_H - (bubblePoint.count / maxCount) * CHART_H;

          // Glow fill follows active line
          const glowLastPoint = isHovering ? activeLastPoint : fullLastPoint;

          return (
            <g key={m.movie.id} transform={`translate(${PAD_L},${PAD_T})`}>
              {/* Glow fill — follows active portion */}
              <path
                d={activePathD + ` L${(glowLastPoint.timeMinutes / maxTime) * CHART_W},${CHART_H} L0,${CHART_H} Z`}
                fill={`url(#glow-${i})`}
              />

              {/* Skeleton trail — full line, dimmed, shown when hovering */}
              {isHovering && (
                <path
                  d={fullPathD}
                  fill="none"
                  stroke={MOVIE_COLORS[i]}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.15}
                />
              )}

              {/* Active colored line */}
              <path
                d={activePathD}
                fill="none"
                stroke={MOVIE_COLORS[i]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#line-glow-${i})`}
              />

              {/* Poster bubble — follows cursor on hover */}
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

        {/* Hover — vertical guideline only */}
        {hover && (
          <line
            x1={hover.svgX}
            y1={PAD_T}
            x2={hover.svgX}
            y2={PAD_T + CHART_H}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </div>
  );
}

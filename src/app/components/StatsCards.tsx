import type { MovieChartView } from "@/lib/types";
import { MOVIE_COLORS } from "@/lib/types";

interface Props {
  movies: MovieChartView[];
  hoverCounts?: number[] | null;
}

export default function StatsCards({ movies, hoverCounts }: Props) {
  if (movies.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-3 px-5 pt-4 pb-8">
      {movies.map((m, i) => {
        const isHovering = hoverCounts != null;
        const displayCount = isHovering ? hoverCounts[i] : m.stats.total;

        return (
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
            <div className="flex items-baseline gap-2">
              <div
                className="text-3xl font-extrabold leading-none tabular-nums transition-all duration-100"
                style={isHovering ? { color: MOVIE_COLORS[i] } : undefined}
              >
                {displayCount}
              </div>
              {isHovering && (
                <span className="text-xs text-[var(--text-muted)]">
                  / {m.stats.total}
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <span className="text-[0.65rem] text-[var(--text-muted)]">
                {m.stats.perMinute.toFixed(2)}/min
              </span>
              <span className="text-[0.65rem]" style={{ color: MOVIE_COLORS[i] }}>
                Peak: {m.stats.peakWindow.startMinute}-{m.stats.peakWindow.endMinute}m
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

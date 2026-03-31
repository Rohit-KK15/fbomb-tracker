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

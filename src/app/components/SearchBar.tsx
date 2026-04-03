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
  const abortRef = useRef<AbortController | null>(null);
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

    if (value.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: Movie[] = await res.json();
          setResults(data);
          setIsOpen(data.length > 0);
        }
      } catch (e: any) {
        if (e.name === "AbortError") return;
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

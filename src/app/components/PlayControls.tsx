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

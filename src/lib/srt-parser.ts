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
const FBOMB_RE = /f(u|oo)(ck|kin)/gi;

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

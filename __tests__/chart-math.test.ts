// __tests__/chart-math.test.ts
import {
  buildCumulativeData,
  computeStats,
  interpolateBezierPath,
} from "../src/lib/chart-math";
import type { FBombEntry } from "../src/lib/types";

describe("buildCumulativeData", () => {
  it("builds cumulative count from f-bomb entries", () => {
    const entries: FBombEntry[] = [
      { timeMinutes: 1, text: "fuck" },
      { timeMinutes: 5, text: "fuck" },
      { timeMinutes: 5, text: "fucking" },
      { timeMinutes: 10, text: "fuck" },
    ];
    const result = buildCumulativeData(entries);
    expect(result).toEqual([
      { timeMinutes: 1, count: 1 },
      { timeMinutes: 5, count: 2 },
      { timeMinutes: 5, count: 3 },
      { timeMinutes: 10, count: 4 },
    ]);
  });

  it("returns starting point for empty entries", () => {
    expect(buildCumulativeData([])).toEqual([{ timeMinutes: 0, count: 0 }]);
  });
});

describe("computeStats", () => {
  it("computes total, perMinute, and peak window", () => {
    const entries: FBombEntry[] = [
      { timeMinutes: 1, text: "a" },
      { timeMinutes: 2, text: "b" },
      { timeMinutes: 2.5, text: "c" },
      { timeMinutes: 3, text: "d" },
      { timeMinutes: 20, text: "e" },
    ];
    const stats = computeStats(entries, 120);
    expect(stats.total).toBe(5);
    expect(stats.perMinute).toBeCloseTo(0.042, 2);
    expect(stats.peakWindow.startMinute).toBeLessThanOrEqual(2);
    expect(stats.peakWindow.count).toBeGreaterThanOrEqual(3);
  });
});

describe("interpolateBezierPath", () => {
  it("returns an SVG path string with smooth curves", () => {
    const points = [
      { timeMinutes: 0, count: 0 },
      { timeMinutes: 5, count: 3 },
      { timeMinutes: 10, count: 7 },
    ];
    const path = interpolateBezierPath(points, 600, 300, 10, 10);
    expect(path).toMatch(/^M/);
    expect(path).toContain("C");
  });

  it("handles single point", () => {
    const points = [{ timeMinutes: 0, count: 0 }];
    const path = interpolateBezierPath(points, 600, 300, 10, 10);
    expect(path).toMatch(/^M/);
  });
});

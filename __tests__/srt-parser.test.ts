import { parseSrt, extractFBombs } from "../src/lib/srt-parser";

const SAMPLE_SRT = `1
00:01:15,000 --> 00:01:17,500
What the fuck are you doing?

2
00:02:30,200 --> 00:02:32,800
That's a nice day.

3
00:05:00,000 --> 00:05:03,000
I don't give a fuck. Fucking hell.

4
00:10:00,000 --> 00:10:02,000
You motherfucker!`;

describe("parseSrt", () => {
  it("parses SRT text into subtitle entries", () => {
    const entries = parseSrt(SAMPLE_SRT);
    expect(entries).toHaveLength(4);
    expect(entries[0]).toEqual({
      startTime: "00:01:15,000",
      endTime: "00:01:17,500",
      text: "What the fuck are you doing?",
    });
  });

  it("handles empty input", () => {
    expect(parseSrt("")).toEqual([]);
  });

  it("handles malformed blocks gracefully", () => {
    const malformed = `1
00:01:00,000 --> 00:01:02,000
Hello

garbage line without timestamp

2
00:02:00,000 --> 00:02:02,000
World`;
    const entries = parseSrt(malformed);
    expect(entries.length).toBeGreaterThanOrEqual(2);
  });
});

describe("extractFBombs", () => {
  it("finds all f-word occurrences with timestamps", () => {
    const entries = parseSrt(SAMPLE_SRT);
    const fbombs = extractFBombs(entries);
    // Block 1: "fuck" (1), Block 3: "fuck" + "Fucking" (2), Block 4: "motherfucker" (1)
    expect(fbombs).toHaveLength(4);
  });

  it("converts timestamps to minutes", () => {
    const entries = parseSrt(SAMPLE_SRT);
    const fbombs = extractFBombs(entries);
    expect(fbombs[0].timeMinutes).toBeCloseTo(1.25, 2);
  });

  it("is case insensitive", () => {
    const srt = `1
00:00:10,000 --> 00:00:12,000
FUCK THIS. Fuck that. fuck everything.`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(3);
  });

  it("matches fookin variant", () => {
    const srt = `1
00:00:05,000 --> 00:00:07,000
You fookin wot mate?`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(1);
  });

  it("does not match non-f-words", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Let's have fun at the duck pond.`;
    const entries = parseSrt(srt);
    const fbombs = extractFBombs(entries);
    expect(fbombs).toHaveLength(0);
  });
});

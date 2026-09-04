import { describe, it, expect } from "vitest";
import { parseScreenplay, screenplayStats, cleanSceneHeading, parseSceneHeadingParts } from "../packages/screenplay-core/src/fountain";
import { paginateScreenplay, pageCount } from "../packages/screenplay-core/src/screenplayFormat";
import { conciseDiff, computeDetailedDiff } from "../packages/screenplay-core/src/diff";
import { SAMPLE_SCREENPLAY_TEXT } from "../packages/project-model/src/sampleProject";

describe("Screenplay Core Engine", () => {
  it("should parse standard Fountain screenplay scenes and character cues", () => {
    const parsed = parseScreenplay(SAMPLE_SCREENPLAY_TEXT);
    expect(parsed.scenes.length).toBe(4);
    expect(parsed.lines.length).toBeGreaterThan(30);

    const firstScene = parsed.scenes[0];
    expect(firstScene.heading).toBe("INT. CYBER VAULT 7 - NIGHT");
    expect(firstScene.intExt).toBe("INT");
    expect(firstScene.location).toBe("CYBER VAULT 7");
    expect(firstScene.timeOfDay).toBe("NIGHT");

    // Check dialogue attribution
    const dialogueLine = parsed.lines.find((l) => l.kind === "dialogue");
    expect(dialogueLine).toBeDefined();
    expect(dialogueLine?.speaker).toBeDefined();
  });

  it("should calculate correct screenplay metrics and statistics", () => {
    const stats = screenplayStats(SAMPLE_SCREENPLAY_TEXT);
    expect(stats.scenes).toBe(4);
    expect(stats.words).toBeGreaterThan(200);
    expect(stats.estimatedPages).toBeGreaterThanOrEqual(1);
    expect(stats.characterCounts["MAYA"]).toBeGreaterThan(0);
    expect(stats.characterCounts["MARCUS"]).toBeGreaterThan(0);
  });

  it("should parse scene heading parts accurately", () => {
    const p1 = parseSceneHeadingParts("INT. HIGH-TECH LAB - NIGHT");
    expect(p1.intExt).toBe("INT");
    expect(p1.location).toBe("HIGH-TECH LAB");
    expect(p1.timeOfDay).toBe("NIGHT");

    const p2 = parseSceneHeadingParts("EXT. MOUNTAIN SUMMIT - DAWN");
    expect(p2.intExt).toBe("EXT");
    expect(p2.location).toBe("MOUNTAIN SUMMIT");
    expect(p2.timeOfDay).toBe("DAWN");

    const p3 = parseSceneHeadingParts("INT./EXT. CAR - CONTINUOUS");
    expect(p3.intExt).toBe("INT/EXT");
    expect(p3.location).toBe("CAR");
    expect(p3.timeOfDay).toBe("CONTINUOUS");
  });

  it("should deterministically paginate screenplay into 54-line pages", () => {
    const pages = paginateScreenplay(SAMPLE_SCREENPLAY_TEXT);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    for (const page of pages) {
      expect(page.lines.length).toBeLessThanOrEqual(55);
    }
  });

  it("should generate concise and detailed diffs", () => {
    const oldText = "Line A\nLine B\nLine C";
    const newText = "Line A\nLine B MODIFIED\nLine C\nLine D";
    const cDiff = conciseDiff(oldText, newText);
    expect(cDiff.identical).toBe(false);
    expect(cDiff.added).toBeGreaterThan(0);

    const dDiff = computeDetailedDiff(oldText, newText);
    expect(dDiff.identical).toBe(false);
    expect(dDiff.addedCount).toBeGreaterThan(0);
    expect(dDiff.lines.some((l) => l.type === "added")).toBe(true);
  });
});

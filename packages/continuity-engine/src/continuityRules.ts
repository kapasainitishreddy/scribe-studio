import type { ContinuityIssue, Project } from "../../project-model/src/types";
import { parseScreenplay } from "../../screenplay-core/src/fountain";

export function analyzeContinuity(project: Project, targetSceneNumbers?: number[]): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  const parsed = parseScreenplay(project.screenplayText);
  const scenesToAnalyze = targetSceneNumbers && targetSceneNumbers.length > 0
    ? parsed.scenes.filter((s) => targetSceneNumbers.includes(s.number))
    : parsed.scenes;

  const now = new Date().toISOString();

  // 1. Time-of-Day Transition Rule
  for (let i = 0; i < parsed.scenes.length - 1; i += 1) {
    const current = parsed.scenes[i];
    const next = parsed.scenes[i + 1];

    if (
      (targetSceneNumbers && !targetSceneNumbers.includes(current.number) && !targetSceneNumbers.includes(next.number))
    ) {
      continue;
    }

    const currTime = current.timeOfDay.toUpperCase();
    const nextTime = next.timeOfDay.toUpperCase();

    if (nextTime === "CONTINUOUS" || nextTime === "MOMENTS LATER") {
      if (currTime.includes("NIGHT") && nextTime.includes("DAY")) {
        issues.push({
          id: `cont-time-${current.number}-${next.number}`,
          category: "time",
          severity: "critical",
          affectedScenes: [current.number, next.number],
          affectedCharacters: [],
          headline: `Time Discontinuity between Scene ${current.number} and Scene ${next.number}`,
          reason: `Scene ${current.number} takes place at ${currTime}, but sequential Scene ${next.number} is marked ${nextTime} yet shifts to daytime abruptly.`,
          supportingEvidence: `Scene ${current.number} Heading: "${current.heading}" vs Scene ${next.number} Heading: "${next.heading}"`,
          suggestedResolution: `Change Scene ${next.number} time of day or add an establishing shot / temporal transition.`,
          status: "active",
          createdAt: now
        });
      }
    }
  }

  // 2. Character Teleportation & Presence Rule
  // Map characters appearing in each scene
  const sceneCharacters = new Map<number, Set<string>>();
  for (const scene of parsed.scenes) {
    const chars = new Set<string>();
    const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
    for (const l of sceneLines) {
      if (l.kind === "character" && l.speaker) {
        chars.add(l.speaker.toLowerCase().trim());
      }
    }
    sceneCharacters.set(scene.number, chars);
  }

  for (let i = 0; i < parsed.scenes.length - 1; i += 1) {
    const s1 = parsed.scenes[i];
    const s2 = parsed.scenes[i + 1];

    if (
      targetSceneNumbers &&
      !targetSceneNumbers.includes(s1.number) &&
      !targetSceneNumbers.includes(s2.number)
    ) {
      continue;
    }

    const s1Chars = sceneCharacters.get(s1.number) ?? new Set<string>();
    const s2Chars = sceneCharacters.get(s2.number) ?? new Set<string>();

    if (s2.timeOfDay.toUpperCase() === "CONTINUOUS" || s2.timeOfDay.toUpperCase() === "MOMENTS LATER") {
      // If locations are distinct and non-adjacent
      if (
        s1.location.toLowerCase() !== s2.location.toLowerCase() &&
        s1.intExt !== s2.intExt &&
        !s1.location.toLowerCase().includes(s2.location.toLowerCase()) &&
        !s2.location.toLowerCase().includes(s1.location.toLowerCase())
      ) {
        for (const char of s1Chars) {
          if (s2Chars.has(char)) {
            // Instant teleportation warning
            issues.push({
              id: `cont-teleport-${s1.number}-${s2.number}-${char}`,
              category: "teleportation",
              severity: "warning",
              affectedScenes: [s1.number, s2.number],
              affectedCharacters: [char],
              headline: `Potential Impossible Travel for ${char.toUpperCase()} between Scene ${s1.number} and ${s2.number}`,
              reason: `${char.toUpperCase()} appears in Scene ${s1.number} (${s1.location}) and immediately appears in Scene ${s2.number} (${s2.location}) marked as ${s2.timeOfDay} with no travel time.`,
              supportingEvidence: `Scene ${s1.number}: ${s1.heading} -> Scene ${s2.number}: ${s2.heading}`,
              suggestedResolution: `Add travel action line, insert an exfiltration shot, or adjust ${s2.timeOfDay} to LATER / HOURS LATER.`,
              status: "active",
              createdAt: now
            });
          }
        }
      }
    }
  }

  // 3. Knowledge Paradox Verification against Story Bible Canon
  for (const charId in project.characters) {
    const char = project.characters[charId];
    for (const fact of project.canon) {
      if (fact.firstSeenSceneNumber && fact.firstSeenSceneNumber > 1) {
        // Look for scenes prior to firstSeenSceneNumber where this character mentions the fact key terms
        const priorScenes = parsed.scenes.filter((s) => s.number < (fact.firstSeenSceneNumber ?? 0));
        for (const s of priorScenes) {
          if (targetSceneNumbers && !targetSceneNumbers.includes(s.number)) continue;
          const sceneLines = parsed.lines.filter(
            (l) => s.lineIds.includes(l.id) && l.speaker?.toLowerCase().includes(char.normalizedName)
          );
          const keywords = fact.title
            .toLowerCase()
            .split(/\s+/)
            .filter((k) => k.length > 4);
          for (const line of sceneLines) {
            const lower = line.text.toLowerCase();
            const matchCount = keywords.filter((k) => lower.includes(k)).length;
            if (matchCount >= 2 && keywords.length >= 2) {
              issues.push({
                id: `cont-knowledge-${char.id}-${s.number}-${fact.id}`,
                category: "knowledge",
                severity: "critical",
                affectedScenes: [s.number, fact.firstSeenSceneNumber],
                affectedCharacters: [char.id],
                headline: `Knowledge Paradox: ${char.name} mentions "${fact.title}" prematurely in Scene ${s.number}`,
                reason: `${char.name} speaks about key elements of "${fact.title}" in Scene ${s.number}, but canon establishes this fact is not discovered until Scene ${fact.firstSeenSceneNumber}.`,
                supportingEvidence: `Scene ${s.number} Dialogue: "${line.text}" vs Canon Fact: "${fact.statement}"`,
                suggestedResolution: `Modify dialogue in Scene ${s.number} to keep the secret guarded until Scene ${fact.firstSeenSceneNumber}.`,
                status: "active",
                createdAt: now
              });
            }
          }
        }
      }
    }
  }

  // 4. Prop Disappearance & Handoff Rule
  const propMentionsByScene = new Map<string, number[]>();
  const parsedProps = project.canon.filter((f) => f.category === "prop");
  for (const prop of parsedProps) {
    const propWords = prop.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (!propWords.length) continue;
    const scenesWhereMentioned: number[] = [];
    for (const scene of parsed.scenes) {
      const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
      const text = sceneLines.map((l) => l.text).join(" ").toLowerCase();
      if (propWords.some((w) => text.includes(w))) {
        scenesWhereMentioned.push(scene.number);
      }
    }
    propMentionsByScene.set(prop.id, scenesWhereMentioned);
  }

  return issues;
}

import type { Project } from "../../project-model/src/types";
import { parseScreenplay, screenplayStats } from "../../screenplay-core/src/fountain";
import type { ProductionLogisticsReport } from "./types";

export function calculateProductionLogistics(project: Project): ProductionLogisticsReport {
  const parsed = parseScreenplay(project.screenplayText);
  const stats = screenplayStats(project.screenplayText);

  let interiorCount = 0;
  let exteriorCount = 0;
  let nightCount = 0;
  let dayCount = 0;
  const locations = new Set<string>();
  const castDayReq: Record<string, number> = {};
  const stuntScenes: number[] = [];
  let vfxCount = 0;
  const riskFactors: string[] = [];

  for (const scene of parsed.scenes) {
    if (scene.intExt === "INT") interiorCount += 1;
    else if (scene.intExt === "EXT") exteriorCount += 1;
    else {
      interiorCount += 0.5;
      exteriorCount += 0.5;
    }

    if (scene.timeOfDay.includes("NIGHT")) nightCount += 1;
    else dayCount += 1;

    if (scene.location) locations.add(scene.location.toUpperCase().trim());

    // Cast presence
    const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
    const sceneSpeakers = new Set<string>();
    for (const line of sceneLines) {
      if (line.kind === "character" && line.speaker) {
        sceneSpeakers.add(line.speaker.toUpperCase().trim());
      }
    }
    for (const sp of sceneSpeakers) {
      castDayReq[sp] = (castDayReq[sp] ?? 0) + 1;
    }

    // Check stunt keywords
    const text = sceneLines.map((l) => l.text).join(" ").toLowerCase();
    if (text.includes("jump") || text.includes("leap") || text.includes("fight") || text.includes("flume")) {
      stuntScenes.push(scene.number);
    }
    if (text.includes("hologram") || text.includes("cyber") || text.includes("matrix") || text.includes("digital")) {
      vfxCount += 1;
    }
  }

  // Risk heuristics
  if (nightCount / (parsed.scenes.length || 1) > 0.4) {
    riskFactors.push(`High night shooting ratio (${Math.round((nightCount / parsed.scenes.length) * 100)}% of scenes). Increased overtime and lighting costs.`);
  }
  if (stuntScenes.length > 0) {
    riskFactors.push(`${stuntScenes.length} action/stunt sequences require specialized safety coordinator and stunt doubles.`);
  }
  if (exteriorCount / (parsed.scenes.length || 1) > 0.4) {
    riskFactors.push(`High exterior exposure (${Math.round((exteriorCount / parsed.scenes.length) * 100)}%). Weather cover sets mandatory.`);
  }

  // Estimated shoot days (assume ~3.5 pages per day for production)
  const estDays = Math.max(1, Math.ceil(stats.estimatedPages / 3.5));

  return {
    totalScenes: parsed.scenes.length,
    totalEstimatedPages: stats.estimatedPages,
    estimatedShootingDays: estDays,
    interiorSceneCount: Math.round(interiorCount),
    exteriorSceneCount: Math.round(exteriorCount),
    nightShootCount: nightCount,
    dayShootCount: dayCount,
    uniqueLocationCount: locations.size,
    locationsList: [...locations].sort(),
    castDayRequirements: castDayReq,
    stuntScenes,
    vfxSceneCount: vfxCount,
    riskFactors
  };
}

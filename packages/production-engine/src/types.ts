import type { BreakdownElement, BreakdownCategory } from "../../project-model/src/types";

export interface SceneBreakdownSummary {
  sceneNumber: number;
  heading: string;
  intExt: string;
  timeOfDay: string;
  elementsByCategory: Record<BreakdownCategory, BreakdownElement[]>;
}

export interface ProductionLogisticsReport {
  totalScenes: number;
  totalEstimatedPages: number;
  estimatedShootingDays: number;
  interiorSceneCount: number;
  exteriorSceneCount: number;
  nightShootCount: number;
  dayShootCount: number;
  uniqueLocationCount: number;
  locationsList: string[];
  castDayRequirements: Record<string, number>;
  stuntScenes: number[];
  vfxSceneCount: number;
  riskFactors: string[];
}

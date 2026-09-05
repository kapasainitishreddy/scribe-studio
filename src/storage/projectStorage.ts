/**
 * Scribe Studio Project Storage Adapter
 * Provides high-level relational operations, debounced autosave,
 * safe localStorage-to-IndexedDB migration, and snapshot backup/restore.
 */

import { scribeDb, ScribeDatabase, type ProjectRecord, type BackupRecord } from "./db";
import type { Project, RevisionRecord } from "../../packages/project-model/src/types";

const LEGACY_STORAGE_KEY = "scribe_studio_project_state";
const DEBOUNCE_DELAY_MS = 600;

let saveTimeoutId: any = null;

/**
 * Save complete project document graph into IndexedDB tables atomically.
 */
export async function saveProject(project: Project, db: ScribeDatabase = scribeDb): Promise<void> {
  if (!project || !project.id) {
    throw new Error("Cannot save invalid project: missing ID.");
  }

  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [
      db.projects,
      db.screenplays,
      db.revisions,
      db.storyboardSequences,
      db.actorPackets,
      db.changePassports,
      db.researchFindings,
      db.scene3DData,
      db.settings
    ],
    async () => {
      // 1. Projects table
      await db.projects.put({
        id: project.id,
        title: project.title,
        author: project.author,
        synopsis: project.synopsis,
        version: project.version,
        projectData: {
          characters: project.characters,
          canon: project.canon,
          breakdown: project.breakdown,
          shotLists: project.shotLists,
          continuityIssues: project.continuityIssues,
          meetingNotes: project.meetingNotes,
          corkboardCards: project.corkboardCards,
          proposals: project.proposals,
          dependencyEdges: project.dependencyEdges,
          extractions: project.extractions,
          storyThreads: project.storyThreads,
          latestImpactReport: project.latestImpactReport,
          propagationState: project.propagationState
        },
        createdAt: project.createdAt || now,
        updatedAt: now
      });

      // 2. Screenplays table
      await db.screenplays.put({
        projectId: project.id,
        screenplayText: project.screenplayText,
        updatedAt: now
      });

      // 3. Revisions table
      for (const rev of project.revisions || []) {
        await db.revisions.put({
          ...rev,
          projectId: project.id
        });
      }

      // 4. Storyboard sequences
      if (project.storyboardSequences) {
        for (const [sceneNumStr, seq] of Object.entries(project.storyboardSequences)) {
          const sceneNum = Number(sceneNumStr);
          await db.storyboardSequences.put({
            id: `${project.id}-seq-${sceneNum}`,
            projectId: project.id,
            sceneNumber: sceneNum,
            sequence: seq,
            updatedAt: now
          });
        }
      }

      // 5. Actor Packets
      if (project.actorPackets) {
        for (const [charId, packet] of Object.entries(project.actorPackets)) {
          await db.actorPackets.put({
            id: `${project.id}-actor-${charId}`,
            projectId: project.id,
            characterId: charId,
            packet,
            updatedAt: now
          });
        }
      }

      // 6. Change Passports
      if (project.changePassports) {
        for (const passport of project.changePassports) {
          await db.changePassports.put({
            id: passport.id,
            projectId: project.id,
            sceneNumber: passport.sceneNumber,
            passport,
            createdAt: passport.timestamp || now
          });
        }
      }

      // 7. Research Findings
      if (project.researchFindings) {
        for (const finding of project.researchFindings) {
          await db.researchFindings.put({
            id: finding.id,
            projectId: project.id,
            sceneNumber: finding.sceneNumber,
            finding,
            retrievedAt: finding.retrievedAt || now
          });
        }
      }

      // 8. 3D Blocking Data
      if (project.scene3DObjects && project.scene3DObjects.length > 0) {
        // Group by scene
        const byScene: Record<number, typeof project.scene3DObjects> = {};
        for (const obj of project.scene3DObjects) {
          if (!byScene[obj.sceneNumber]) byScene[obj.sceneNumber] = [];
          byScene[obj.sceneNumber].push(obj);
        }
        for (const [scStr, objs] of Object.entries(byScene)) {
          const scNum = Number(scStr);
          await db.scene3DData.put({
            id: `${project.id}-3d-${scNum}`,
            projectId: project.id,
            sceneNumber: scNum,
            objects: objs,
            updatedAt: now
          });
        }
      }

      // 9. Settings
      if (project.settings) {
        await db.settings.put({
          projectId: project.id,
          settings: project.settings,
          updatedAt: now
        });
      }
    }
  );
}

/**
 * Load complete project from IndexedDB by ID (or the most recently updated project).
 */
export async function loadProject(
  projectId?: string,
  db: ScribeDatabase = scribeDb
): Promise<Project | null> {
  let targetId = projectId;

  if (!targetId) {
    // Find most recently updated project
    const latest = await db.projects.orderBy("updatedAt").reverse().first();
    if (!latest) return null;
    targetId = latest.id;
  }

  const projRecord = await db.projects.get(targetId);
  if (!projRecord) return null;

  const screenplayRecord = await db.screenplays.get(targetId);
  const revisions = await db.revisions.where("projectId").equals(targetId).toArray();
  const seqRecords = await db.storyboardSequences.where("projectId").equals(targetId).toArray();
  const actorRecords = await db.actorPackets.where("projectId").equals(targetId).toArray();
  const passportRecords = await db.changePassports.where("projectId").equals(targetId).toArray();
  const researchRecords = await db.researchFindings.where("projectId").equals(targetId).toArray();
  const scene3DRecords = await db.scene3DData.where("projectId").equals(targetId).toArray();
  const settingsRecord = await db.settings.get(targetId);

  // Assemble storyboard sequences
  const storyboardSequences: Record<string | number, any> = {};
  seqRecords.forEach((r) => {
    storyboardSequences[r.sceneNumber] = r.sequence;
  });

  // Assemble actor packets
  const actorPackets: Record<string, any> = {};
  actorRecords.forEach((r) => {
    actorPackets[r.characterId] = r.packet;
  });

  // Assemble 3D objects
  const scene3DObjects: any[] = [];
  scene3DRecords.forEach((r) => {
    scene3DObjects.push(...r.objects);
  });

  const projectData = projRecord.projectData || {};
  const now = new Date().toISOString();

  const project: Project = {
    id: projRecord.id,
    title: projRecord.title,
    author: projRecord.author,
    synopsis: projRecord.synopsis,
    version: projRecord.version,
    screenplayText: screenplayRecord?.screenplayText || "",
    characters: projectData.characters || {},
    canon: projectData.canon || [],
    breakdown: projectData.breakdown || { elements: [], lastUpdated: now },
    actorPackets,
    shotLists: projectData.shotLists || {},
    revisions: revisions.length > 0 ? revisions : (projectData.revisions || []),
    continuityIssues: projectData.continuityIssues || [],
    meetingNotes: projectData.meetingNotes || [],
    corkboardCards: projectData.corkboardCards || [],
    proposals: projectData.proposals || [],
    researchFindings: researchRecords.map((r) => r.finding),
    scene3DObjects,
    dependencyEdges: projectData.dependencyEdges || [],
    extractions: projectData.extractions || {},
    storyboardSequences,
    storyThreads: projectData.storyThreads || [],
    latestImpactReport: projectData.latestImpactReport || null,
    propagationState: projectData.propagationState || {
      lastEvaluatedVersion: projRecord.version || 1,
      staleActorPackets: [],
      staleShotLists: [],
      staleBreakdownScenes: [],
      flaggedContinuityScenes: [],
      staleStoryboardPanels: [],
      auditTrail: []
    },
    changePassports: passportRecords.map((r) => r.passport),
    settings: settingsRecord?.settings || {
      defaultRevisionColor: "White",
      activeProvider: "google-adk",
      providers: {
        "google-gemini": { provider: "google-gemini", model: "gemini-2.5-flash", isDefault: false },
        "google-adk": { provider: "google-adk", model: "gemini-2.5-pro", isDefault: true },
        "parallel-search": { provider: "parallel-search", model: "default", isDefault: false },
        "google-deterministic": { provider: "google-deterministic", model: "rule-based", isDefault: false }
      },
      typography: {
        fontFamily: "Courier Prime, Courier, monospace",
        fontSize: 12,
        lineSpacing: 1.2
      },
      editorMode: "standard",
      theme: "dark",
      autosaveIntervalMs: 2000
    },
    createdAt: projRecord.createdAt,
    updatedAt: projRecord.updatedAt
  };

  return project;
}

/**
 * List all projects stored in IndexedDB.
 */
export async function listProjects(db: ScribeDatabase = scribeDb): Promise<ProjectRecord[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

/**
 * Delete a project and all associated records across all tables.
 */
export async function deleteProject(projectId: string, db: ScribeDatabase = scribeDb): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.projects,
      db.screenplays,
      db.revisions,
      db.storyboardSequences,
      db.actorPackets,
      db.changePassports,
      db.researchFindings,
      db.scene3DData,
      db.settings,
      db.backups
    ],
    async () => {
      await db.projects.delete(projectId);
      await db.screenplays.delete(projectId);
      await db.revisions.where("projectId").equals(projectId).delete();
      await db.storyboardSequences.where("projectId").equals(projectId).delete();
      await db.actorPackets.where("projectId").equals(projectId).delete();
      await db.changePassports.where("projectId").equals(projectId).delete();
      await db.researchFindings.where("projectId").equals(projectId).delete();
      await db.scene3DData.where("projectId").equals(projectId).delete();
      await db.settings.delete(projectId);
      await db.backups.where("projectId").equals(projectId).delete();
    }
  );
}

/**
 * Create a snapshot backup of a project.
 */
export async function createBackup(
  project: Project,
  label: string = "Manual Snapshot",
  db: ScribeDatabase = scribeDb
): Promise<string> {
  const backupId = `backup-${project.id}-${Date.now()}`;
  const backup: BackupRecord = {
    id: backupId,
    projectId: project.id,
    timestamp: new Date().toISOString(),
    label,
    snapshot: JSON.parse(JSON.stringify(project))
  };

  await db.backups.put(backup);
  return backupId;
}

/**
 * Restore a project from a snapshot backup.
 */
export async function restoreBackup(
  backupId: string,
  db: ScribeDatabase = scribeDb
): Promise<Project | null> {
  const record = await db.backups.get(backupId);
  if (!record || !record.snapshot) return null;

  await saveProject(record.snapshot, db);
  return record.snapshot;
}

/**
 * Debounced autosave to prevent disk thrashing on every keystroke.
 */
export function debouncedSaveProject(
  project: Project,
  delayMs: number = DEBOUNCE_DELAY_MS,
  db: ScribeDatabase = scribeDb
): Promise<void> {
  return new Promise((resolve) => {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
    }
    saveTimeoutId = setTimeout(async () => {
      try {
        await saveProject(project, db);
      } catch (err) {
        console.error("Debounced autosave failed:", err);
      }
      resolve();
    }, delayMs);
  });
}

export const LEGACY_STORAGE_KEYS = [
  LEGACY_STORAGE_KEY,
  "agentic_cinema_active_project_v1"
];

/**
 * Detect legacy localStorage project data, migrate it once into IndexedDB,
 * verify migration, and clean up legacy storage safely.
 */
export async function migrateLegacyLocalStorage(db: ScribeDatabase = scribeDb): Promise<boolean> {
  const storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : (typeof localStorage !== "undefined" ? localStorage : null);
  if (!storage) {
    return false;
  }

  let migratedAny = false;

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacyData = storage.getItem(key);
    if (!legacyData) {
      continue;
    }

    try {
      const parsed = JSON.parse(legacyData);
      if (!parsed || !parsed.id || !parsed.title) {
        // Invalid or corrupted legacy entry; do not import
        continue;
      }

      // Save into IndexedDB
      await saveProject(parsed, db);

      // Verify migration
      const verified = await loadProject(parsed.id, db);
      if (verified && verified.id === parsed.id) {
        // Safely remove giant serialized legacy string from localStorage
        storage.removeItem(key);
        console.log(`Successfully migrated project "${parsed.title}" from ${key} to IndexedDB.`);
        migratedAny = true;
      }
    } catch (err) {
      console.error(`Migration from legacy localStorage key "${key}" failed:`, err);
    }
  }

  return migratedAny;
}

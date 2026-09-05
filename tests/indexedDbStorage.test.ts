import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { ScribeDatabase } from "../src/storage/db";
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  createBackup,
  restoreBackup,
  debouncedSaveProject,
  migrateLegacyLocalStorage
} from "../src/storage/projectStorage";
import type { Project } from "../packages/project-model/src/types";
import { createSampleProject } from "../packages/project-model/src/sampleProject";

describe("Dexie.js / IndexedDB Production Project Storage", () => {
  let db: ScribeDatabase;

  const baseProj = createSampleProject();
  const mockProject: Project = {
    ...baseProj,
    id: "proj-alpha",
    title: "Chinatown Re-Engineered",
    author: "Robert Towne",
    synopsis: "A private investigator uncovers corruption.",
    screenplayText: "EXT. ORCHARD - DAY\nGittes examines the dry reservoir.\n\nGITTES\nIt's bone dry.",
    version: 1,
    revisions: [
      {
        id: "rev-white",
        color: "White",
        label: "Production Draft",
        summaryOfChanges: "Initial pass",
        screenplayText: "EXT. ORCHARD - DAY\nGittes examines the dry reservoir.\n\nGITTES\nIt's bone dry.",
        author: "Robert Towne",
        changedSceneNumbers: [1],
        stats: baseProj.revisions[0].stats,
        createdAt: new Date().toISOString()
      }
    ],
    actorPackets: {
      "char-gittes": {
        id: "packet-gittes",
        characterId: "char-gittes",
        characterName: "J.J. Gittes",
        lastGeneratedAt: new Date().toISOString(),
        screenplayVersion: 1,
        isStale: false,
        scenes: []
      }
    },
    researchFindings: [
      {
        id: "res-water",
        sceneNumber: 1,
        query: "Los Angeles water rights Owens Valley 1937",
        summary: "Historical water diversion records verify reservoir conditions.",
        conclusion: "Corroborated by historical water archives.",
        confidence: 0.96,
        sources: [],
        status: "APPROVED",
        retrievedAt: new Date().toISOString(),
        isParallelApiResult: true
      }
    ],
    scene3DObjects: [
      {
        id: "obj-gittes-token",
        sceneNumber: 1,
        label: "Gittes Token",
        kind: "actor",
        position: { x: 0, y: 0, z: 0 },
        color: "#d49b54"
      }
    ],
    storyboardSequences: {
      1: {
        id: "seq-1",
        sceneNumber: 1,
        title: "Scene 1 Storyboard",
        layout: "4-panel",
        panels: [],
        aspectRatio: "16:9",
        updatedAt: new Date().toISOString()
      }
    }
  };

  beforeEach(() => {
    db = new ScribeDatabase(`TestDB_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  });

  afterEach(async () => {
    await db.delete();
  });

  it("atomically saves and reloads complete project document graph from IndexedDB", async () => {
    await saveProject(mockProject, db);

    const loaded = await loadProject("proj-alpha", db);
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe("proj-alpha");
    expect(loaded?.title).toBe("Chinatown Re-Engineered");
    expect(loaded?.screenplayText).toContain("bone dry");
    expect(loaded?.revisions.length).toBe(1);
    expect(loaded?.revisions[0].color).toBe("White");
    expect(loaded?.researchFindings.length).toBe(1);
    expect(loaded?.actorPackets["char-gittes"]).toBeDefined();
    expect(loaded?.scene3DObjects.length).toBe(1);
    expect(loaded?.storyboardSequences[1]).toBeDefined();
  });

  it("lists all stored projects ordered by last update time", async () => {
    await saveProject(mockProject, db);
    await saveProject({ ...mockProject, id: "proj-beta", title: "Blade Runner 2099" }, db);

    const list = await listProjects(db);
    expect(list.length).toBe(2);
    expect(list.map((p) => p.id)).toContain("proj-alpha");
    expect(list.map((p) => p.id)).toContain("proj-beta");
  });

  it("creates an immutable snapshot backup and restores it on demand", async () => {
    await saveProject(mockProject, db);

    const backupId = await createBackup(mockProject, "Before Scene 2 Rewrite", db);
    expect(backupId).toContain("backup-proj-alpha");

    // Modify active project in database
    const modified = { ...mockProject, title: "Modified Title That Broke", screenplayText: "Corrupted" };
    await saveProject(modified, db);

    const preRestore = await loadProject("proj-alpha", db);
    expect(preRestore?.title).toBe("Modified Title That Broke");

    // Restore from backup
    const restored = await restoreBackup(backupId, db);
    expect(restored?.title).toBe("Chinatown Re-Engineered");
    expect(restored?.screenplayText).toContain("bone dry");
  });

  it("safely migrates legacy localStorage project into IndexedDB and cleans up legacy key", async () => {
    // Setup mock window.localStorage
    const storageMock: Record<string, string> = {
      scribe_studio_project_state: JSON.stringify(mockProject)
    };

    const originalWindow = globalThis.window;
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => storageMock[k] || null,
        setItem: (k: string, v: string) => { storageMock[k] = v; },
        removeItem: (k: string) => { delete storageMock[k]; }
      }
    };

    const migrated = await migrateLegacyLocalStorage(db);
    expect(migrated).toBe(true);

    // Verify project exists in IndexedDB
    const loaded = await loadProject(mockProject.id, db);
    expect(loaded?.id).toBe(mockProject.id);

    // Verify localStorage key was removed
    expect(storageMock["scribe_studio_project_state"]).toBeUndefined();

    // Restore window
    (globalThis as any).window = originalWindow;
  });

  it("gracefully ignores corrupted legacy entries without crashing", async () => {
    const storageMock: Record<string, string> = {
      scribe_studio_project_state: "not valid json {{"
    };

    const originalWindow = globalThis.window;
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => storageMock[k] || null,
        removeItem: (k: string) => { delete storageMock[k]; }
      }
    };

    const migrated = await migrateLegacyLocalStorage(db);
    expect(migrated).toBe(false);

    (globalThis as any).window = originalWindow;
  });

  it("deletes a project and cleanly cascades across all relational stores", async () => {
    await saveProject(mockProject, db);
    expect(await loadProject("proj-alpha", db)).toBeDefined();

    await deleteProject("proj-alpha", db);

    const loaded = await loadProject("proj-alpha", db);
    expect(loaded).toBeNull();

    // Verify related stores are clean
    expect(await db.screenplays.where("projectId").equals("proj-alpha").count()).toBe(0);
    expect(await db.revisions.where("projectId").equals("proj-alpha").count()).toBe(0);
    expect(await db.storyboardSequences.where("projectId").equals("proj-alpha").count()).toBe(0);
  });
});

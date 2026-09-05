/**
 * Scribe Studio Production IndexedDB Database
 * Powered by Dexie.js (Apache-2.0)
 * Replaces unreliable single-key localStorage with a multi-store relational document database.
 */

import Dexie, { type Table } from "dexie";
import type {
  Project,
  RevisionRecord,
  StoryboardSequence,
  ActorPacket,
  ProductionChangePassport,
  ResearchFinding,
  Scene3DObject,
  ProjectSettings
} from "../../packages/project-model/src/types";

export interface ProjectRecord {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  version: number;
  projectData?: Partial<Project>;
  createdAt: string;
  updatedAt: string;
}

export interface ScreenplayRecord {
  projectId: string;
  screenplayText: string;
  updatedAt: string;
}

export interface RevisionStoreRecord extends RevisionRecord {
  projectId: string;
}

export interface StoryboardSequenceStoreRecord {
  id: string;
  projectId: string;
  sceneNumber: number;
  sequence: StoryboardSequence;
  updatedAt: string;
}

export interface ActorPacketStoreRecord {
  id: string;
  projectId: string;
  characterId: string;
  packet: ActorPacket;
  updatedAt: string;
}

export interface ChangePassportStoreRecord {
  id: string;
  projectId: string;
  sceneNumber: number;
  passport: ProductionChangePassport;
  createdAt: string;
}

export interface ResearchFindingStoreRecord {
  id: string;
  projectId: string;
  sceneNumber: number;
  finding: ResearchFinding;
  retrievedAt: string;
}

export interface Scene3DStoreRecord {
  id: string;
  projectId: string;
  sceneNumber: number;
  objects: Scene3DObject[];
  updatedAt: string;
}

export interface SettingsStoreRecord {
  projectId: string;
  settings: ProjectSettings;
  updatedAt: string;
}

export interface BackupRecord {
  id: string;
  projectId: string;
  timestamp: string;
  label: string;
  snapshot: Project;
}

export class ScribeDatabase extends Dexie {
  projects!: Table<ProjectRecord, string>;
  screenplays!: Table<ScreenplayRecord, string>;
  revisions!: Table<RevisionStoreRecord, string>;
  storyboardSequences!: Table<StoryboardSequenceStoreRecord, string>;
  actorPackets!: Table<ActorPacketStoreRecord, string>;
  changePassports!: Table<ChangePassportStoreRecord, string>;
  researchFindings!: Table<ResearchFindingStoreRecord, string>;
  scene3DData!: Table<Scene3DStoreRecord, string>;
  settings!: Table<SettingsStoreRecord, string>;
  backups!: Table<BackupRecord, string>;

  constructor(databaseName: string = "ScribeStudioProductionDB", options?: any) {
    super(databaseName, options);

    // Schema declaration version 1
    this.version(1).stores({
      projects: "id, title, updatedAt, version",
      screenplays: "projectId, updatedAt",
      revisions: "id, projectId, color, createdAt",
      storyboardSequences: "id, projectId, sceneNumber, updatedAt",
      actorPackets: "id, projectId, characterId, updatedAt",
      changePassports: "id, projectId, sceneNumber, createdAt",
      researchFindings: "id, projectId, sceneNumber, retrievedAt",
      scene3DData: "id, projectId, sceneNumber, updatedAt",
      settings: "projectId, updatedAt",
      backups: "id, projectId, timestamp, label"
    });
  }
}

export const scribeDb = new ScribeDatabase();

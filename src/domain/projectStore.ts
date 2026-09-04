import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Project,
  CanonFact,
  CharacterPersona,
  BreakdownElement,
  ActorPacket,
  ShotList,
  RevisionRecord,
  StickyNote,
  CorkboardCard,
  AgentProposal,
  AIProviderName,
  RevisionColor
} from "../../packages/project-model/src/types";
import { createSampleProject } from "../../packages/project-model/src/sampleProject";
import { propagateScreenplayChange } from "../../packages/continuity-engine/src/propagationEngine";
import { parseScreenplay, screenplayStats } from "../../packages/screenplay-core/src/fountain";
import { conciseDiff } from "../../packages/screenplay-core/src/diff";
import { classifySceneElements, generateFullBreakdown } from "../../packages/production-engine/src/breakdownClassifier";
import { analyzeContinuity } from "../../packages/continuity-engine/src/continuityRules";

const LOCAL_STORAGE_KEY = "agentic_cinema_active_project_v1";
const BACKUP_STORAGE_KEY = "agentic_cinema_backups_v1";

export function useProject() {
  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return createSampleProject();
  });

  const [activeTab, setActiveTab] = useState<
    | "editor"
    | "story-bible"
    | "breakdown"
    | "continuity"
    | "actor-packets"
    | "director"
    | "corkboard"
    | "revisions"
    | "producer"
  >("editor");

  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("maya-lin");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWriterModalOpen, setIsWriterModalOpen] = useState(false);
  const [isTableReadOpen, setIsTableReadOpen] = useState(false);
  const [isScribeModalOpen, setIsScribeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AgentProposal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn("Autosave to localStorage failed:", e);
    }
  }, [project]);

  // Derived stats & parsed screenplay
  const parsedScreenplay = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const stats = useMemo(() => screenplayStats(project.screenplayText), [project.screenplayText]);

  // Master update screenplay action with reactive propagation engine
  const updateScreenplay = useCallback(
    (newText: string, source: "user-edit" | "agent-proposal-applied" | "reversion" = "user-edit") => {
      setProject((prev) => {
        const result = propagateScreenplayChange(prev, newText, source);
        return result.updatedProject;
      });
    },
    []
  );

  // Accept an AI agent proposal
  const acceptProposal = useCallback((proposal: AgentProposal) => {
    setProject((prev) => {
      // Replace scene text
      const parsed = parseScreenplay(prev.screenplayText);
      const scene = parsed.scenes.find((s) => s.number === proposal.targetSceneNumber);
      if (!scene) return prev;

      const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
      const oldSceneText = sceneLines.map((l) => l.text).join("\n");
      const newScreenplayText = prev.screenplayText.replace(oldSceneText, proposal.proposedText);

      const result = propagateScreenplayChange(prev, newScreenplayText, "agent-proposal-applied");
      const updated = { ...result.updatedProject };

      // Update proposal status
      updated.proposals = [
        ...updated.proposals.filter((p) => p.id !== proposal.id),
        { ...proposal, status: "accepted" as const }
      ];
      return updated;
    });
    setActiveProposal(null);
  }, []);

  const rejectProposal = useCallback((proposal: AgentProposal) => {
    setProject((prev) => ({
      ...prev,
      proposals: [
        ...prev.proposals.filter((p) => p.id !== proposal.id),
        { ...proposal, status: "rejected" as const }
      ]
    }));
    setActiveProposal(null);
  }, []);

  // Regenerate Actor Packet for a character
  const regenerateActorPacket = useCallback((characterId: string) => {
    setProject((prev) => {
      const parsed = parseScreenplay(prev.screenplayText);
      const char = prev.characters[characterId];
      if (!char) return prev;

      const targetUpper = char.name.toUpperCase().trim();
      const packetScenes = parsed.scenes
        .filter((scene) => {
          const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
          return sceneLines.some((l) => l.speaker?.toUpperCase().trim() === targetUpper);
        })
        .map((scene) => {
          const sceneLines = parsed.lines.filter((l) => scene.lineIds.includes(l.id));
          const cues: any[] = [];
          let pendingCue: string | null = null;
          let pendingSpeaker: string | null = null;

          for (const line of sceneLines) {
            if (line.kind === "character") {
              const sp = line.speaker?.toUpperCase().trim() ?? "";
              if (sp === targetUpper) {
                // Attach cue
                cues.push({
                  lineId: line.id,
                  cueSpeaker: pendingSpeaker || "SCENE START",
                  cueLine: pendingCue || "(Enters scene)",
                  dialogueLines: [],
                  parenthetical: undefined
                });
                pendingCue = null;
                pendingSpeaker = null;
              } else {
                pendingSpeaker = sp;
              }
            } else if (line.kind === "dialogue") {
              if (cues.length > 0 && cues[cues.length - 1].dialogueLines) {
                cues[cues.length - 1].dialogueLines.push(line.text);
              } else {
                pendingCue = line.text;
              }
            } else if (line.kind === "parenthetical") {
              if (cues.length > 0) {
                cues[cues.length - 1].parenthetical = line.text;
              }
            }
          }

          return {
            sceneId: scene.id,
            sceneNumber: scene.number,
            sceneHeading: scene.heading,
            dramaticObjective: char.dramaticObjective,
            emotionalState: "Focused under active scenario stakes",
            wardrobeCheck: char.wardrobeNotes || "Standard continuity outfit",
            propsRequired: [],
            secretsKnown: char.knowledgeByScene[scene.number] || [],
            cues
          };
        });

      const updatedPacket: ActorPacket = {
        id: `ap-${characterId}`,
        characterId,
        characterName: char.name,
        lastGeneratedAt: new Date().toISOString(),
        screenplayVersion: prev.version,
        isStale: false,
        staleReason: undefined,
        staleDiffPreview: undefined,
        scenes: packetScenes
      };

      const updated = { ...prev };
      updated.actorPackets = { ...updated.actorPackets, [characterId]: updatedPacket };
      updated.propagationState.staleActorPackets = updated.propagationState.staleActorPackets.filter(
        (id) => id !== characterId
      );
      return updated;
    });
  }, []);

  // Regenerate all stale actor packets
  const regenerateAllStalePackets = useCallback(() => {
    setProject((prev) => {
      let current = prev;
      for (const charId of prev.propagationState.staleActorPackets) {
        // inline logic for state purity
      }
      return current;
    });
    // Call per character
    for (const charId of project.propagationState.staleActorPackets) {
      regenerateActorPacket(charId);
    }
  }, [project.propagationState.staleActorPackets, regenerateActorPacket]);

  // Create new revision snapshot
  const createRevision = useCallback((color: RevisionColor, label: string, summary: string) => {
    setProject((prev) => {
      const now = new Date().toISOString();
      const newRev: RevisionRecord = {
        id: `rev-${color.toLowerCase()}-${Date.now()}`,
        color,
        label,
        screenplayText: prev.screenplayText,
        createdAt: now,
        author: prev.author,
        summaryOfChanges: summary,
        changedSceneNumbers: parsedScreenplay.scenes.map((s) => s.number),
        stats
      };
      return {
        ...prev,
        revisions: [newRev, ...prev.revisions]
      };
    });
  }, [parsedScreenplay.scenes, stats]);

  // Restore previous revision
  const restoreRevision = useCallback((revisionId: string) => {
    setProject((prev) => {
      const rev = prev.revisions.find((r) => r.id === revisionId);
      if (!rev) return prev;
      const result = propagateScreenplayChange(prev, rev.screenplayText, "reversion");
      return result.updatedProject;
    });
  }, []);

  // Story Bible Canon mutations
  const updateCanonFact = useCallback((fact: CanonFact) => {
    setProject((prev) => {
      const idx = prev.canon.findIndex((f) => f.id === fact.id);
      const updatedCanon = [...prev.canon];
      if (idx !== -1) {
        updatedCanon[idx] = fact;
      } else {
        updatedCanon.push(fact);
      }
      return { ...prev, canon: updatedCanon };
    });
  }, []);

  const addCanonFact = useCallback((newFact: Omit<CanonFact, "id" | "createdAt" | "updatedAt">) => {
    setProject((prev) => {
      const now = new Date().toISOString();
      const fact: CanonFact = {
        ...newFact,
        id: `canon-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      return { ...prev, canon: [...prev.canon, fact] };
    });
  }, []);

  // Breakdown element mutations
  const toggleBreakdownLock = useCallback((elementId: string) => {
    setProject((prev) => ({
      ...prev,
      breakdown: {
        ...prev.breakdown,
        elements: prev.breakdown.elements.map((e) =>
          e.id === elementId ? { ...e, locked: !e.locked } : e
        )
      }
    }));
  }, []);

  const addBreakdownElement = useCallback((element: Omit<BreakdownElement, "id">) => {
    setProject((prev) => ({
      ...prev,
      breakdown: {
        ...prev.breakdown,
        elements: [
          ...prev.breakdown.elements,
          { ...element, id: `bk-user-${Date.now()}` }
        ]
      }
    }));
  }, []);

  // Continuity issue actions
  const resolveContinuityIssue = useCallback((issueId: string, action: "dismissed" | "intentional" | "resolved") => {
    setProject((prev) => ({
      ...prev,
      continuityIssues: prev.continuityIssues.map((i) =>
        i.id === issueId ? { ...i, status: action } : i
      )
    }));
  }, []);

  // Corkboard & Meeting notes
  const addStickyNote = useCallback((note: Omit<StickyNote, "id" | "createdAt">) => {
    setProject((prev) => ({
      ...prev,
      meetingNotes: [
        { ...note, id: `note-${Date.now()}`, createdAt: new Date().toISOString() },
        ...prev.meetingNotes
      ]
    }));
  }, []);

  const updateCorkboardCards = useCallback((cards: CorkboardCard[]) => {
    setProject((prev) => ({ ...prev, corkboardCards: cards }));
  }, []);

  // Reset to initial sample project
  const loadSampleProject = useCallback(() => {
    const sample = createSampleProject();
    setProject(sample);
  }, []);

  // Create empty new project
  const createNewProject = useCallback((title: string, author: string) => {
    const emptyScript = `Title: ${title.toUpperCase()}\nCredit: Written by\nAuthor: ${author}\n\nINT. FIRST SCENE - DAY\n\nBegin typing your screenplay here...\n`;
    const newProj = createSampleProject();
    newProj.id = `proj-${Date.now()}`;
    newProj.title = title;
    newProj.author = author;
    newProj.screenplayText = emptyScript;
    newProj.version = 1;
    newProj.characters = {};
    newProj.canon = [];
    newProj.breakdown.elements = [];
    newProj.actorPackets = {};
    newProj.shotLists = {};
    newProj.revisions = [];
    newProj.meetingNotes = [];
    newProj.corkboardCards = [];
    newProj.continuityIssues = [];
    setProject(newProj);
  }, []);

  // Update AI provider settings
  const setActiveAiProvider = useCallback((provider: AIProviderName, apiKey?: string) => {
    setProject((prev) => {
      const updatedProviders = { ...prev.settings.providers };
      if (updatedProviders[provider]) {
        updatedProviders[provider] = {
          ...updatedProviders[provider],
          apiKey: apiKey ?? updatedProviders[provider].apiKey
        };
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          activeProvider: provider,
          providers: updatedProviders
        }
      };
    });
  }, []);

  return {
    project,
    parsedScreenplay,
    stats,
    activeTab,
    setActiveTab,
    selectedSceneNumber,
    setSelectedSceneNumber,
    selectedCharacterId,
    setSelectedCharacterId,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isWriterModalOpen,
    setIsWriterModalOpen,
    isTableReadOpen,
    setIsTableReadOpen,
    isScribeModalOpen,
    setIsScribeModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    activeProposal,
    setActiveProposal,
    searchQuery,
    setSearchQuery,
    updateScreenplay,
    acceptProposal,
    rejectProposal,
    regenerateActorPacket,
    regenerateAllStalePackets,
    createRevision,
    restoreRevision,
    updateCanonFact,
    addCanonFact,
    toggleBreakdownLock,
    addBreakdownElement,
    resolveContinuityIssue,
    addStickyNote,
    updateCorkboardCards,
    loadSampleProject,
    createNewProject,
    setActiveAiProvider
  };
}

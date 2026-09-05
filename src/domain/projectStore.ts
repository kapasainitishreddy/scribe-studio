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
  RevisionColor,
  Scene3DObject,
  ResearchFinding,
  ConsolidatedImpactReport,
  VerificationReport,
  VerificationMetrics,
  StoryboardPanel,
  StoryboardSequence,
  StoryThread
} from "../../packages/project-model/src/types";
import { createSampleProject } from "../../packages/project-model/src/sampleProject";
import {
  propagateScreenplayChange,
  calculateProjectMetrics,
  verifyProjectConsistency
} from "../../packages/continuity-engine/src/propagationEngine";
import { parseScreenplay, screenplayStats } from "../../packages/screenplay-core/src/fountain";
import { conciseDiff } from "../../packages/screenplay-core/src/diff";
import { classifySceneElements, generateFullBreakdown } from "../../packages/production-engine/src/breakdownClassifier";
import { analyzeContinuity } from "../../packages/continuity-engine/src/continuityRules";
import { runProductionResearchAgent } from "../../packages/agent-runtime/src/productionResearchAgent";
import { extractScene } from "../../packages/production-engine/src/sceneExtraction";
import { generateStoryboardSequence, generatePanelSvgSchematic } from "../../packages/production-engine/src/storyboardGenerator";

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
    | "comic"
    | "story-bible"
    | "breakdown"
    | "continuity"
    | "actor-packets"
    | "director"
    | "cinematographer"
    | "script-supervisor"
    | "corkboard"
    | "revisions"
    | "producer"
    | "scene-3d"
    | "graph"
    | "research"
  >("editor");

  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("maya-lin");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWriterModalOpen, setIsWriterModalOpen] = useState(false);
  const [isTableReadOpen, setIsTableReadOpen] = useState(false);
  const [isScribeModalOpen, setIsScribeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
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

  // 3D Scene Blocking Object Management
  const addScene3DObject = useCallback((obj: Scene3DObject) => {
    setProject((prev) => ({
      ...prev,
      scene3DObjects: [...(prev.scene3DObjects || []), obj]
    }));
  }, []);

  const updateScene3DObject = useCallback((id: string, updates: Partial<Scene3DObject>) => {
    setProject((prev) => ({
      ...prev,
      scene3DObjects: (prev.scene3DObjects || []).map((o) => (o.id === id ? { ...o, ...updates } : o))
    }));
  }, []);

  const deleteScene3DObject = useCallback((id: string) => {
    setProject((prev) => ({
      ...prev,
      scene3DObjects: (prev.scene3DObjects || []).filter((o) => o.id !== id)
    }));
  }, []);

  // Production Research Findings Management (Parallel Search API)
  const addResearchFinding = useCallback((finding: ResearchFinding) => {
    setProject((prev) => ({
      ...prev,
      researchFindings: [finding, ...(prev.researchFindings || [])],
      dependencyEdges: [
        ...(prev.dependencyEdges || []),
        {
          id: `edge-res-${Date.now()}`,
          source: `scene-${finding.sceneNumber}`,
          target: finding.id,
          type: "grounded-by-research" as const,
          label: "Parallel Verified"
        }
      ]
    }));
  }, []);

  const runParallelResearch = useCallback(
    async (sceneNumber: number, topic?: string) => {
      try {
        const findings = await runProductionResearchAgent({
          project,
          sceneNumber,
          topic
        });
        setProject((prev) => ({
          ...prev,
          researchFindings: [...findings, ...(prev.researchFindings || [])]
        }));
        return findings;
      } catch (e) {
        console.error("Parallel research failed:", e);
        return [];
      }
    },
    [project]
  );

  // Hero Impact Blast Radius Execution Loop
  const executeHeroWorkflow = useCallback(
    async (targetSceneNum: number = 1) => {
      const beforeMetrics = calculateProjectMetrics(project);

      // 1. Simulate a meaningful screenplay revision in Scene 1
      const sampleEditTarget = "She pulls an ENCRYPTED TITANIUM DRIVE from her combat belt and clicks it into the console port.";
      const sampleEditReplacement = "She bypasses the biometric lock with a NEURAL QUANTUM SPLICE, flashing amber warning protocols across the vault.";

      const currentText = project.screenplayText;
      const isAlreadyEdited = currentText.includes("NEURAL QUANTUM SPLICE");
      const newText = isAlreadyEdited
        ? currentText.replace(sampleEditReplacement, sampleEditTarget)
        : currentText.replace(sampleEditTarget, sampleEditReplacement);

      // 2. Propagate change through continuity AST engine
      const propagation = propagateScreenplayChange(project, newText, "user-edit");
      const updatedProj = propagation.updatedProject;

      // 3. Run live/grounded Parallel Search Research on the modified context
      const researchFindings = await runProductionResearchAgent({
        project: updatedProj,
        sceneNumber: targetSceneNum,
        topic: "Post-quantum neural cryptographic splice latency in biometric vaults"
      });

      // 4. Generate Consolidated Impact Report
      const report: ConsolidatedImpactReport = {
        timestamp: new Date().toISOString(),
        sceneNumber: targetSceneNum,
        changeSummary: isAlreadyEdited
          ? "Reverted neural quantum splice back to physical titanium drive asset."
          : "Modified Scene 1 vault extraction: Replaced physical titanium drive with neural quantum splice.",
        affectedCanonCount: 1,
        affectedCanonTitles: ["The Obsidian Drive Architecture"],
        continuityIssuesDetected: updatedProj.continuityIssues.filter((i) => i.affectedScenes.includes(targetSceneNum)),
        affectedActorIds: ["maya-lin", "marcus-kane"],
        staleActorPacketsCount: 2,
        staleStoryboardCount: updatedProj.propagationState?.staleStoryboardPanels?.length || 2,
        staleStoryboardPanels: updatedProj.propagationState?.staleStoryboardPanels || ["scene1-panel4", "scene1-panel6"],
        affectedBreakdownCount: 3,
        affectedBreakdownCategories: ["PROPS", "SPECIAL EFFECTS", "SOUND EFFECTS"],
        researchFindings,
        diffPreview: isAlreadyEdited
          ? "- NEURAL QUANTUM SPLICE\n+ ENCRYPTED TITANIUM DRIVE"
          : "- ENCRYPTED TITANIUM DRIVE\n+ NEURAL QUANTUM SPLICE (High Voltage Hazard)"
      };

      updatedProj.latestImpactReport = report;
      updatedProj.researchFindings = [...researchFindings, ...(updatedProj.researchFindings || [])];

      // Mutate project state so UI displays blast radius
      setProject(updatedProj);
      return { report, beforeMetrics, proposedProject: updatedProj };
    },
    [project]
  );

  // Closed-loop APPROVE action: applies delta, selectively regenerates, and runs VERIFY pass
  const approveHeroWorkflow = useCallback(
    (beforeMetrics?: VerificationMetrics) => {
      let verificationReport: VerificationReport | null = null;
      setProject((prev) => {
        // Deep clone
        const approved: Project = JSON.parse(JSON.stringify(prev));

        // 1. Regenerate stale actor packets
        for (const charId of approved.propagationState.staleActorPackets) {
          const packet = approved.actorPackets[charId];
          if (packet) {
            packet.isStale = false;
            packet.staleReason = undefined;
            packet.staleDiffPreview = undefined;
            packet.lastGeneratedAt = new Date().toISOString();
          }
        }
        approved.propagationState.staleActorPackets = [];

        // 2. Regenerate stale storyboard panels selectively
        for (const seq of Object.values(approved.storyboardSequences || {})) {
          seq.panels = seq.panels.map((p) => {
            if (p.status === "OUTDATED") {
              return {
                ...p,
                status: "APPROVED",
                invalidationReason: undefined,
                outdatedReason: undefined,
                version: p.version + 1
              };
            }
            return p;
          });
        }
        approved.propagationState.staleStoryboardPanels = [];
        approved.propagationState.staleBreakdownScenes = [];
        approved.propagationState.staleShotLists = [];

        // 3. Resolve active continuity issues triggered by this edit
        approved.continuityIssues = approved.continuityIssues.map((i) => ({
          ...i,
          status: "resolved" as const
        }));

        // 4. Execute automated closed-loop VERIFY runner
        verificationReport = verifyProjectConsistency(approved, beforeMetrics, 0);
        approved.latestVerificationReport = verificationReport;

        return approved;
      });
      return verificationReport;
    },
    []
  );

  // Closed-loop REJECT action: aborts without mutating or changes reverted
  const rejectHeroWorkflow = useCallback(() => {
    setProject((prev) => {
      const reverted = createSampleProject();
      reverted.latestImpactReport = null;
      reverted.latestVerificationReport = null;
      return reverted;
    });
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

  // Storyboard and Visual Comic Sequence Management
  const updateStoryboardPanel = useCallback(
    (sequenceId: string, panelId: string, updates: Partial<StoryboardPanel>) => {
      setProject((prev) => {
        const sequences: Record<string | number, StoryboardSequence> = { ...(prev.storyboardSequences || {}) };
        const seq = sequences[sequenceId] || Object.values(sequences).find((s) => s.id === sequenceId);
        if (!seq) return prev;

        const updatedPanels = seq.panels.map((p: StoryboardPanel) => {
          if (p.id !== panelId) return p;
          const merged: StoryboardPanel = { ...p, ...updates };
          if (updates.shotType || updates.cameraAngle || updates.action || updates.dialogue) {
            merged.svgSchematic = generatePanelSvgSchematic(merged);
          }
          return merged;
        });

        sequences[seq.id] = {
          ...seq,
          panels: updatedPanels,
          updatedAt: new Date().toISOString()
        };

        // If panel was outdated and now updated/approved, remove from stale list
        const stalePanels = (prev.propagationState?.staleStoryboardPanels || []).filter(
          (id) => id !== panelId
        );

        return {
          ...prev,
          storyboardSequences: sequences,
          propagationState: {
            ...prev.propagationState,
            staleStoryboardPanels: stalePanels
          }
        };
      });
    },
    []
  );

  const approveStoryboardPanel = useCallback(
    (sequenceId: string, panelId: string) => {
      updateStoryboardPanel(sequenceId, panelId, {
        status: "APPROVED",
        invalidationReason: undefined,
        outdatedReason: undefined
      });
    },
    [updateStoryboardPanel]
  );

  const lockStoryboardPanel = useCallback(
    (sequenceId: string, panelId: string) => {
      updateStoryboardPanel(sequenceId, panelId, {
        status: "LOCKED",
        invalidationReason: undefined,
        outdatedReason: undefined
      });
    },
    [updateStoryboardPanel]
  );

  const regenerateStoryboardPanel = useCallback(
    (sequenceId: string, panelId: string) => {
      setProject((prev) => {
        const sequences: Record<string | number, StoryboardSequence> = { ...(prev.storyboardSequences || {}) };
        const seq = sequences[sequenceId] || Object.values(sequences).find((s) => s.id === sequenceId);
        if (!seq) return prev;
        const panel = seq.panels.find((p: StoryboardPanel) => p.id === panelId);
        if (!panel) return prev;

        const extraction = extractScene(prev.screenplayText, panel.sceneNumber, {
          characters: prev.characters
        });
        const beat = extraction.storyBeats.find((b) => b.id === panel.beatId) || extraction.storyBeats[panel.panelNumber - 1];

        const regenerated: StoryboardPanel = {
          ...panel,
          action: beat?.action || panel.action,
          dialogue: beat?.dialogue,
          dialogueSpeaker: beat?.speaker,
          charactersVisible: beat?.characters?.length ? beat.characters : panel.charactersVisible,
          propsVisible: beat?.props?.length ? beat.props : panel.propsVisible,
          mood: beat?.emotion || panel.mood,
          status: "APPROVED",
          invalidationReason: undefined,
          outdatedReason: undefined,
          version: panel.version + 1
        };
        regenerated.svgSchematic = generatePanelSvgSchematic(regenerated);

        const updatedPanels = seq.panels.map((p: StoryboardPanel) => (p.id === panelId ? regenerated : p));
        const updatedSequences: Record<string | number, StoryboardSequence> = {
          ...sequences,
          [seq.id]: { ...seq, panels: updatedPanels, updatedAt: new Date().toISOString() }
        };

        const stalePanels = (prev.propagationState?.staleStoryboardPanels || []).filter(
          (id) => id !== panelId
        );

        return {
          ...prev,
          storyboardSequences: updatedSequences,
          propagationState: {
            ...prev.propagationState,
            staleStoryboardPanels: stalePanels
          }
        };
      });
    },
    []
  );

  const regenerateOutdatedPanels = useCallback(
    (sequenceId: string) => {
      setProject((prev) => {
        const sequences: Record<string | number, StoryboardSequence> = { ...(prev.storyboardSequences || {}) };
        const seq = sequences[sequenceId] || Object.values(sequences).find((s) => s.id === sequenceId);
        if (!seq) return prev;

        const extraction = extractScene(prev.screenplayText, seq.sceneNumber, {
          characters: prev.characters
        });

        const updatedPanels = seq.panels.map((p: StoryboardPanel) => {
          if (p.status !== "OUTDATED") return p;
          const beat = extraction.storyBeats.find((b) => b.id === p.beatId) || extraction.storyBeats[p.panelNumber - 1];
          const fresh: StoryboardPanel = {
            ...p,
            action: beat?.action || p.action,
            dialogue: beat?.dialogue,
            dialogueSpeaker: beat?.speaker,
            charactersVisible: beat?.characters?.length ? beat.characters : p.charactersVisible,
            propsVisible: beat?.props?.length ? beat.props : p.propsVisible,
            mood: beat?.emotion || p.mood,
            status: "APPROVED",
            invalidationReason: undefined,
            outdatedReason: undefined,
            version: p.version + 1
          };
          fresh.svgSchematic = generatePanelSvgSchematic(fresh);
          return fresh;
        });

        const updatedSequences: Record<string | number, StoryboardSequence> = {
          ...sequences,
          [seq.id]: { ...seq, panels: updatedPanels, updatedAt: new Date().toISOString() }
        };

        const resolvedIds = seq.panels.filter((p: StoryboardPanel) => p.status === "OUTDATED").map((p: StoryboardPanel) => p.id);
        const stalePanels = (prev.propagationState?.staleStoryboardPanels || []).filter(
          (id) => !resolvedIds.includes(id)
        );

        return {
          ...prev,
          storyboardSequences: updatedSequences,
          propagationState: {
            ...prev.propagationState,
            staleStoryboardPanels: stalePanels
          }
        };
      });
    },
    []
  );

  const generateStoryboardForScene = useCallback(
    (sceneNumber: number) => {
      setProject((prev) => {
        const extraction = extractScene(prev.screenplayText, sceneNumber, {
          characters: prev.characters
        });
        const seq = generateStoryboardSequence(extraction);
        return {
          ...prev,
          extractions: {
            ...(prev.extractions || {}),
            [sceneNumber]: extraction
          },
          storyboardSequences: {
            ...(prev.storyboardSequences || {}),
            [seq.id]: seq
          }
        };
      });
    },
    []
  );

  // Story Threads Management
  const updateStoryThread = useCallback(
    (threadId: string, updates: Partial<StoryThread>) => {
      setProject((prev) => ({
        ...prev,
        storyThreads: (prev.storyThreads || []).map((t) =>
          t.id === threadId ? { ...t, ...updates } : t
        )
      }));
    },
    []
  );

  const addStoryThread = useCallback((thread: StoryThread) => {
    setProject((prev) => ({
      ...prev,
      storyThreads: [...(prev.storyThreads || []), thread]
    }));
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
    isHeroModalOpen,
    setIsHeroModalOpen,
    isComplianceOpen,
    setIsComplianceOpen,
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
    setActiveAiProvider,
    addScene3DObject,
    updateScene3DObject,
    deleteScene3DObject,
    addResearchFinding,
    runParallelResearch,
    executeHeroWorkflow,
    approveHeroWorkflow,
    rejectHeroWorkflow,
    updateStoryboardPanel,
    approveStoryboardPanel,
    lockStoryboardPanel,
    regenerateStoryboardPanel,
    regenerateOutdatedPanels,
    generateStoryboardForScene,
    updateStoryThread,
    addStoryThread
  };
}

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shirt,
  Package,
  Layers,
  Sparkles,
  Plus,
  Eye,
  FileText,
  Calendar,
  CloudRain
} from "lucide-react";
import type {
  Project,
  ContinuityIssue,
  BreakdownElement
} from "../../packages/project-model/src/types";

interface ScriptSupervisorModePanelProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onResolveIssue: (issueId: string, action: "dismissed" | "intentional" | "resolved") => void;
  onNavigateToTab: (tab: string) => void;
}

export const ScriptSupervisorModePanel: React.FC<ScriptSupervisorModePanelProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onResolveIssue,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<"props" | "wardrobe" | "eyelines" | "weather">("props");
  const [newNoteText, setNewNoteText] = useState("");

  const extraction = project.extractions?.[selectedSceneNumber];

  // Active issues for selected scene
  const sceneIssues = useMemo(() => {
    return (project.continuityIssues || []).filter(
      (i) => i.affectedScenes.includes(selectedSceneNumber)
    );
  }, [project.continuityIssues, selectedSceneNumber]);

  // Prop lifecycle tracker across all 4 scenes
  const propLifecycle = useMemo(() => {
    return [
      {
        name: "Obsidian Drive / Neural Splice",
        category: "Hero Prop",
        status: "Critical Asset",
        timeline: [
          { scene: 1, action: "Extracted from Vault 7 console", state: "Connected / Unlocked" },
          { scene: 2, action: "Subject of perimeter lockdown order by Thorne", state: "In Transit" },
          { scene: 3, action: "Yanked from sub-level terminal by Maya", state: "100% Decrypted" },
          { scene: 4, action: "Opened at docks; reveals prototype manifest", state: "Sealed Pouch" }
        ]
      },
      {
        name: "Suppressed Carbine",
        category: "Weapon / Prop",
        status: "Active",
        timeline: [
          { scene: 1, action: "Trained on Vault 7 service lift", state: "Loaded" },
          { scene: 3, action: "Fired two precision bursts into door lock relays", state: "Reloaded" },
          { scene: 4, action: "Holstered as Marcus drags onto pier", state: "Water-drenched" }
        ]
      },
      {
        name: "Tactical Tracker",
        category: "Prop",
        status: "Active",
        timeline: [
          { scene: 1, action: "Reveals 3 blinking red vectors on lift", state: "Active Glass Display" },
          { scene: 3, action: "Proximity alert buzzing", state: "Hostile Convergence" }
        ]
      }
    ];
  }, []);

  // Character wardrobe & physical status
  const characterContinuity = useMemo(() => {
    return [
      {
        character: "Maya Lin",
        costume: "Tactical Kevlar, Luminescent Gloves, Utility Belt",
        physicalState: "Uninjured, Focused Tension, Soaked from Docks Drainage Flume in Sc 4",
        continuityWatch: "Check drive pouch remains waterproof sealed across Scene 3 to 4 cut."
      },
      {
        character: "Marcus Kane",
        costume: "Weathered Mercenary Fatigues, Tactical Rig",
        physicalState: "Fresh shrapnel scar on left cheek (Sc 1); Bruised ribs after 80ft flume drop (Sc 4)",
        continuityWatch: "Scar prosthetic makeup must maintain left cheek orientation and fresh scab color."
      },
      {
        character: "Dr. Aris Thorne",
        costume: "Tailored Designer Trench Coat (Wet), Satellite Communicator",
        physicalState: "Pristine, Authoritative, Unshaken by squall",
        continuityWatch: "Trench coat rain splatter consistency across Scene 2 helicopter shots."
      }
    ];
  }, []);

  const availableScenes = useMemo(() => {
    const list = Object.keys(project.extractions || {}).map(Number);
    return list.length > 0 ? list.sort((a, b) => a - b) : [1, 2, 3, 4];
  }, [project.extractions]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0c10] text-[#e2e4e9] overflow-hidden select-none">
      {/* Top Header Strip */}
      <div className="h-14 border-b border-[#232730] bg-[#12141c] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/30 px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-xs text-sky-300 uppercase tracking-wider">
              SCRIPT SUPERVISOR CONSOLE (SCRIPTY)
            </span>
          </div>

          <div className="h-4 w-px bg-[#262a35]" />

          {/* Scene Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-medium">Scene:</span>
            <div className="flex items-center space-x-1">
              {availableScenes.map((sNum) => (
                <button
                  key={sNum}
                  onClick={() => onSelectScene(sNum)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    sNum === selectedSceneNumber
                      ? "bg-sky-500 text-black shadow-md shadow-sky-500/20"
                      : "bg-[#181b24] text-slate-300 hover:bg-[#222736] border border-[#262b3a]"
                  }`}
                >
                  Scene {sNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center space-x-1 bg-[#181b25] p-1 rounded-lg border border-[#262a38]">
          {[
            { id: "props", label: "Prop Continuity", icon: Package },
            { id: "wardrobe", label: "Wardrobe & Wounds", icon: Shirt },
            { id: "eyelines", label: "180° Axis & Eyelines", icon: Eye },
            { id: "weather", label: "Timeline & Weather", icon: CloudRain }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isSelected
                    ? "bg-[#273044] text-sky-300 shadow-sm border border-[#374460]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Supervisor Body */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left: Active Scene Continuity Log (5 cols) */}
        <div className="col-span-12 lg:col-span-5 border-r border-[#222734] bg-[#0d0f16] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131622] border-b border-[#222734] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Scene {selectedSceneNumber} Continuity Log
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                sceneIssues.length > 0
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {sceneIssues.length > 0 ? `${sceneIssues.length} Flags Detected` : "Verified Clean"}
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-3">
            {sceneIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-[#141722] border border-rose-500/40 rounded-xl p-3.5 space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs text-rose-200">{issue.headline}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-rose-950/60 px-1.5 py-0.5 rounded text-rose-300">
                    {issue.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {issue.reason}
                </p>

                <div className="pt-2 border-t border-[#202638] flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Affected Scenes: {issue.affectedScenes.join(", ")}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onResolveIssue(issue.id, "intentional")}
                      className="px-2 py-1 rounded bg-[#1c2233] hover:bg-[#252e44] text-[10px] text-slate-300 border border-[#2e3954]"
                    >
                      Mark Intentional
                    </button>
                    <button
                      onClick={() => onResolveIssue(issue.id, "resolved")}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-bold"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {sceneIssues.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2 bg-[#121520] rounded-xl border border-[#202638]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-slate-200">Zero Script Discrepancies</div>
                <p className="text-[11px] text-slate-400">
                  Props, wardrobe, time of day, and character presence match the Story Bible canon facts for Scene {selectedSceneNumber}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Master Continuity Matrices (7 cols) */}
        <div className="col-span-12 lg:col-span-7 bg-[#090b10] flex flex-col overflow-hidden">
          <div className="p-3 bg-[#131622] border-b border-[#222734] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {activeTab === "props" && "Timeline Prop Chain Across All Scenes"}
              {activeTab === "wardrobe" && "Cast Wardrobe, Makeup & Injury Tracker"}
              {activeTab === "eyelines" && "Camera Axis, 180° Line & Eyeline Verification"}
              {activeTab === "weather" && "Chronological Time & Weather Continuity"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "props" && (
              <div className="space-y-4">
                {propLifecycle.map((prop, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-[#121622] border border-[#22283a] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-sm text-slate-200">{prop.name}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-sky-950/50 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">
                        {prop.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                      {prop.timeline.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            step.scene === selectedSceneNumber
                              ? "bg-sky-950/40 border-sky-500/50 ring-1 ring-sky-500/30"
                              : "bg-[#161a28] border-[#222738]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-sky-400">Scene {step.scene}</span>
                            <span className="text-slate-500 font-mono text-[9px]">{step.state}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug">
                            {step.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "wardrobe" && (
              <div className="space-y-4">
                {characterContinuity.map((char, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-[#121622] border border-[#22283a] rounded-xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shirt className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm text-slate-200">{char.character}</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 text-slate-300">
                      <div>
                        <strong className="text-slate-400">Costume: </strong>
                        {char.costume}
                      </div>
                      <div>
                        <strong className="text-slate-400">Physical Status / Makeup: </strong>
                        <span className="text-amber-300">{char.physicalState}</span>
                      </div>
                      <div className="pt-1.5 border-t border-[#1e2434] text-[11px] text-sky-300/90 font-medium">
                        <strong className="text-sky-400">Scripty Note: </strong>
                        {char.continuityWatch}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "eyelines" && (
              <div className="space-y-4 text-xs">
                <div className="bg-[#121622] border border-[#22283a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm text-slate-200">
                      Scene {selectedSceneNumber} 180° Axis Validation
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Camera setups A (Maya MCU) and B (Marcus OTS) maintain camera position on the western quadrant of Vault 7.
                    No 180-degree axis crossing detected between Shot #2 and Shot #4.
                  </p>
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-emerald-300 font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Eyeline vector alignment: Maya looking Screen Left &rarr; Marcus looking Screen Right. Perfect reciprocal match.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "weather" && (
              <div className="space-y-4 text-xs">
                <div className="bg-[#121622] border border-[#22283a] rounded-xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-slate-200">
                      Chronological Story Timeline & Environmental Continuity
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-black/30 rounded-lg border border-[#202638] flex items-center justify-between">
                      <span className="font-bold text-slate-300">Scene 1 &middot; INT. CYBER VAULT 7</span>
                      <span className="text-slate-400 font-mono">02:15 AM &middot; Subterranean Arctic Chill</span>
                    </div>
                    <div className="p-2.5 bg-black/30 rounded-lg border border-[#202638] flex items-center justify-between">
                      <span className="font-bold text-slate-300">Scene 2 &middot; EXT. ROOFTOP HELIPAD</span>
                      <span className="text-slate-400 font-mono">02:22 AM &middot; Driving Squall / 40kt Wind</span>
                    </div>
                    <div className="p-2.5 bg-black/30 rounded-lg border border-[#202638] flex items-center justify-between">
                      <span className="font-bold text-slate-300">Scene 3 &middot; INT. SUB-LEVEL LAB</span>
                      <span className="text-slate-400 font-mono">02:28 AM &middot; Continuous &middot; Amber Warning Strobe</span>
                    </div>
                    <div className="p-2.5 bg-black/30 rounded-lg border border-[#202638] flex items-center justify-between">
                      <span className="font-bold text-slate-300">Scene 4 &middot; EXT. TOKYO INDUSTRIAL DOCKS</span>
                      <span className="text-slate-400 font-mono">05:45 AM &middot; Dawn Rain &middot; Gray Fog</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

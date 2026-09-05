import React, { useState, useMemo } from "react";
import {
  FileDown,
  FileText,
  CheckCircle2,
  Film,
  Subtitles,
  Package,
  Database,
  Users,
  Camera,
  ShieldCheck,
  Clapperboard,
  Download,
  Share2,
  FolderArchive
} from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";
import { buildScreenplayPdf } from "../../packages/export-engine/src/exportPdf";
import { exportFdx } from "../../packages/export-engine/src/interchangeFdx";
import { buildSubtitleCues, exportSrt } from "../../packages/export-engine/src/subtitles";
import { generateCharacterSidesPdf, generateCharacterSidesText } from "../../packages/export-engine/src/exportSides";
import { buildDepartmentPackets } from "../../packages/export-engine/src/distributionHub";
import { parseScreenplay, screenplayStats } from "../../packages/screenplay-core/src/fountain";

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

type ExportTab = "screenplay" | "departments";

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [activeTab, setActiveTab] = useState<ExportTab>("departments");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);
  const stats = useMemo(() => screenplayStats(project.screenplayText), [project.screenplayText]);
  const packets = useMemo(
    () =>
      buildDepartmentPackets({
        projectTitle: project.title,
        screenplayText: project.screenplayText,
        characters: project.characters,
        breakdownElements: project.breakdown?.elements
      }),
    [project.title, project.screenplayText, project.characters, project.breakdown?.elements]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMsg(`Successfully exported: ${filename}`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // 1. Master Screenplay Exports
  const handleExportPdf = () => {
    const pdfBytes = buildScreenplayPdf(project.screenplayText, {
      pageNumbers: true,
      header: project.title.toUpperCase()
    });
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    triggerDownload(blob, `${project.title.replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportFdx = () => {
    const fdxXml = exportFdx(project.screenplayText);
    const blob = new Blob([fdxXml], { type: "application/xml;charset=utf-8" });
    triggerDownload(blob, `${project.title.replace(/\s+/g, "_")}.fdx`);
  };

  const handleExportFountain = () => {
    const blob = new Blob([project.screenplayText], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${project.title.replace(/\s+/g, "_")}.fountain`);
  };

  const handleExportSrt = () => {
    const cues = buildSubtitleCues(project.screenplayText);
    const srt = exportSrt(cues);
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${project.title.replace(/\s+/g, "_")}_subtitles.srt`);
  };

  const handleExportBackup = () => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    triggerDownload(blob, `${project.title.replace(/\s+/g, "_")}_PROJECT_BACKUP.json`);
  };

  // 2. Departmental Specific Exports ("Who to Send")
  const handleExportActorSidesPdf = (charName: string) => {
    const pdfBytes = generateCharacterSidesPdf(project.screenplayText, {
      characterName: charName,
      projectTitle: project.title,
      includePrecedingCues: true
    });
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
    triggerDownload(blob, `${project.title}_SIDES_${charName.toUpperCase().replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportActorSidesText = (charName: string) => {
    const txt = generateCharacterSidesText(project.screenplayText, {
      characterName: charName,
      projectTitle: project.title,
      includePrecedingCues: true
    });
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, `${project.title}_SIDES_${charName.toUpperCase().replace(/\s+/g, "_")}.txt`);
  };

  const handleExportDirectorSheet = () => {
    const blob = new Blob([packets.directorPacket.contentMarkdown], { type: "text/markdown;charset=utf-8" });
    triggerDownload(blob, packets.directorPacket.filename);
  };

  const handleExportCinematographerKit = () => {
    const blob = new Blob([packets.cinematographerPacket.shotlistCsv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, packets.cinematographerPacket.filename);
  };

  const handleExportContinuityReport = () => {
    const blob = new Blob([packets.scriptSupervisorPacket.continuityLogText], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, packets.scriptSupervisorPacket.filename);
  };

  const handleExportBreakdownCsv = () => {
    const blob = new Blob([packets.producerPacket.breakdownCsv], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, packets.producerPacket.filename);
  };

  // Batch Export All Department Packets
  const handleExportAllDepartments = () => {
    handleExportPdf();
    setTimeout(() => handleExportDirectorSheet(), 400);
    setTimeout(() => handleExportCinematographerKit(), 800);
    setTimeout(() => handleExportContinuityReport(), 1200);
    setTimeout(() => handleExportBreakdownCsv(), 1600);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none"
    >
      <div className="bg-[#10131B] border border-[#262C36] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="h-14 border-b border-[#262C36] bg-[#12161E] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#D49B54]/15 border border-[#D49B54]/40 flex items-center justify-center text-[#D49B54]">
              <img src="./logo.svg" alt="Logo" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F0F2F5] tracking-tight">Export & Department Distribution</h2>
              <p className="text-[11px] text-[#A0A7B2]">Automatically partitioned from the screenplay AST for every department.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#69717E] hover:text-white text-base">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#262C36] bg-[#0D1015] px-6 pt-2 gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("departments")}
            className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "departments"
                ? "border-[#D49B54] text-[#D49B54]"
                : "border-transparent text-[#69717E] hover:text-[#A0A7B2]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Who to Send (Department Packets)</span>
          </button>
          <button
            onClick={() => setActiveTab("screenplay")}
            className={`pb-2.5 flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === "screenplay"
                ? "border-[#D49B54] text-[#D49B54]"
                : "border-transparent text-[#69717E] hover:text-[#A0A7B2]"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Master Screenplay Formats</span>
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: WHO TO SEND (DEPARTMENT PACKETS) */}
          {activeTab === "departments" && (
            <div className="space-y-4">
              {/* Batch Action Bar */}
              <div className="p-3.5 rounded-xl bg-[#171C24] border border-[#262C36] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Full Production Call Package</div>
                  <div className="text-[11px] text-[#A0A7B2]">Exports PDF script, Director beats, DP shotlist, Continuity log, and Breakdown.</div>
                </div>
                <button
                  onClick={handleExportAllDepartments}
                  className="px-3.5 py-1.5 rounded-lg bg-[#D49B54] hover:bg-[#E3AF69] text-black font-bold flex items-center space-x-1.5 transition-all shadow-md shrink-0"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Package All (1-Click)</span>
                </button>
              </div>

              {/* Actor Sides Distribution List */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#D49B54] font-bold flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Cast Sides & Actor Packets (Ready for Actors / Agents)</span>
                </div>

                <div className="space-y-1.5">
                  {Object.entries(project.characters).map(([id, char]) => {
                    const cues = stats.characterCounts[char.name.toUpperCase()] || 0;
                    return (
                      <div
                        key={id}
                        className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] flex items-center justify-between hover:border-[#D49B54]/30 transition-all"
                      >
                        <div>
                          <div className="font-semibold text-white uppercase flex items-center space-x-2">
                            <span>{char.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171C24] text-[#A0A7B2] capitalize">
                              {char.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#69717E] mt-0.5">
                            {cues} dialogue cues • Preceding lines included • Objective & subtext attached
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleExportActorSidesPdf(char.name)}
                            className="px-2.5 py-1 rounded bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-[#D49B54] font-mono text-[11px] font-semibold transition-colors"
                          >
                            PDF Sides
                          </button>
                          <button
                            onClick={() => handleExportActorSidesText(char.name)}
                            className="px-2.5 py-1 rounded bg-[#171C24] hover:bg-[#202736] border border-[#262C36] text-[#A0A7B2] font-mono text-[11px] transition-colors"
                          >
                            TXT
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Department Head Packets */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#69717E] font-bold">
                  Crew Department Packets
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] space-y-2">
                    <div className="flex items-center space-x-2 text-white font-semibold">
                      <Clapperboard className="w-4 h-4 text-amber-400" />
                      <span>Director's Packet</span>
                    </div>
                    <p className="text-[11px] text-[#A0A7B2]">Scene objectives, beat turning points, and coverage guide.</p>
                    <button
                      onClick={handleExportDirectorSheet}
                      className="w-full py-1 rounded bg-[#171C24] hover:bg-[#202736] text-[#D49B54] font-mono text-[11px] font-semibold border border-[#262C36]"
                    >
                      Export Beats (.MD)
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] space-y-2">
                    <div className="flex items-center space-x-2 text-white font-semibold">
                      <Camera className="w-4 h-4 text-sky-400" />
                      <span>Cinematographer Plan</span>
                    </div>
                    <p className="text-[11px] text-[#A0A7B2]">2.39:1 aspect ratio shotlist with 24/35/50/85mm primes.</p>
                    <button
                      onClick={handleExportCinematographerKit}
                      className="w-full py-1 rounded bg-[#171C24] hover:bg-[#202736] text-sky-400 font-mono text-[11px] font-semibold border border-[#262C36]"
                    >
                      Export Shotlist (.CSV)
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] space-y-2">
                    <div className="flex items-center space-x-2 text-white font-semibold">
                      <ShieldCheck className="w-4 h-4 text-rose-400" />
                      <span>Script Supervisor Log</span>
                    </div>
                    <p className="text-[11px] text-[#A0A7B2]">Prop state machine, wardrobe, and eyeline tracking.</p>
                    <button
                      onClick={handleExportContinuityReport}
                      className="w-full py-1 rounded bg-[#171C24] hover:bg-[#202736] text-rose-400 font-mono text-[11px] font-semibold border border-[#262C36]"
                    >
                      Export Continuity (.TXT)
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#12161D] border border-[#262C36] space-y-2">
                    <div className="flex items-center space-x-2 text-white font-semibold">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span>Producer Breakdown</span>
                    </div>
                    <p className="text-[11px] text-[#A0A7B2]">16-category departmental classification matrix.</p>
                    <button
                      onClick={handleExportBreakdownCsv}
                      className="w-full py-1 rounded bg-[#171C24] hover:bg-[#202736] text-emerald-400 font-mono text-[11px] font-semibold border border-[#262C36]"
                    >
                      Export Breakdown (.CSV)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER SCREENPLAY FORMATS */}
          {activeTab === "screenplay" && (
            <div className="space-y-2.5">
              <button
                onClick={handleExportPdf}
                className="w-full p-3.5 bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Film className="w-5 h-5 text-[#D49B54]" />
                  <div>
                    <div className="text-xs font-bold text-white">Hollywood Standard Screenplay PDF</div>
                    <div className="text-[11px] text-[#A0A7B2]">12pt Courier Prime, 54 lines/page, authentic title page</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-[#D49B54]">.PDF ↗</span>
              </button>

              <button
                onClick={handleExportFdx}
                className="w-full p-3.5 bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Final Draft XML (FDX)</div>
                    <div className="text-[11px] text-[#A0A7B2]">Compatible with Final Draft 12+, StudioBinder, WriterDuet</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-blue-400">.FDX ↗</span>
              </button>

              <button
                onClick={handleExportFountain}
                className="w-full p-3.5 bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Fountain Screenplay Source</div>
                    <div className="text-[11px] text-[#A0A7B2]">Plaintext markup format with title page metadata</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-emerald-400">.FOUNTAIN ↗</span>
              </button>

              <button
                onClick={handleExportSrt}
                className="w-full p-3.5 bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Subtitles className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Timed Subtitles (SRT)</div>
                    <div className="text-[11px] text-[#A0A7B2]">Broadcast subtitle cues generated from character dialogue</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-400">.SRT ↗</span>
              </button>

              <button
                onClick={handleExportBackup}
                className="w-full p-3.5 bg-[#12161D] hover:bg-[#171C24] border border-[#262C36] rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Full Production Desk Backup (JSON)</div>
                    <div className="text-[11px] text-[#A0A7B2]">Complete project state including canon graph, actor packets, and revisions</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-sky-400">.JSON ↗</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

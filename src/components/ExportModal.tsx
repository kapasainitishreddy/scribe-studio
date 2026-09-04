import React, { useState } from "react";
import { FileDown, FileText, CheckCircle2, Film, Subtitles, Package, Database } from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";
import { buildScreenplayPdf } from "../../packages/export-engine/src/exportPdf";
import { exportFdx } from "../../packages/export-engine/src/interchangeFdx";
import { buildSubtitleCues, exportSrt, exportVtt } from "../../packages/export-engine/src/subtitles";

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-[#13151f] border border-[#272d3e] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="h-14 border-b border-[#232838] bg-[#10121a] px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200">Export & Interchange Hub</h2>
              <p className="text-[11px] text-slate-400">Industry-compliant screenplay formats and production assets.</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-3">
          <button
            onClick={handleExportPdf}
            className="w-full p-3.5 bg-[#171a25] hover:bg-[#202535] border border-[#272e42] rounded-xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center space-x-3">
              <Film className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Industry Standard PDF</div>
                <div className="text-[11px] text-slate-400">12pt Courier, 54 lines/page, formatted title page</div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-400">.PDF ↗</span>
          </button>

          <button
            onClick={handleExportFdx}
            className="w-full p-3.5 bg-[#171a25] hover:bg-[#202535] border border-[#272e42] rounded-xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Final Draft XML (FDX)</div>
                <div className="text-[11px] text-slate-400">Compatible with Final Draft 12+, StudioBinder, WriterDuet</div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-400">.FDX ↗</span>
          </button>

          <button
            onClick={handleExportFountain}
            className="w-full p-3.5 bg-[#171a25] hover:bg-[#202535] border border-[#272e42] rounded-xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Fountain Screenplay Source</div>
                <div className="text-[11px] text-slate-400">Plaintext markup format with title page fields</div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400">.FOUNTAIN ↗</span>
          </button>

          <button
            onClick={handleExportSrt}
            className="w-full p-3.5 bg-[#171a25] hover:bg-[#202535] border border-[#272e42] rounded-xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center space-x-3">
              <Subtitles className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Subtitles (SRT)</div>
                <div className="text-[11px] text-slate-400">Timed subtitle cues generated from character dialogue</div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-purple-400">.SRT ↗</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="w-full p-3.5 bg-[#171a25] hover:bg-[#202535] border border-[#272e42] rounded-xl flex items-center justify-between text-left transition-all"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-xs font-bold text-slate-200">Complete Project Backup (JSON)</div>
                <div className="text-[11px] text-slate-400">Includes screenplay, canon graph, actor packets, and revisions</div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-sky-400">.JSON ↗</span>
          </button>
        </div>
      </div>
    </div>
  );
};

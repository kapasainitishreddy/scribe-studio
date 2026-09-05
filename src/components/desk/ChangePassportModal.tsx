import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  Cpu,
  Check,
  X,
  Clock,
  Layers,
  Search,
  Lock
} from "lucide-react";
import type { ProductionChangePassport } from "../../../packages/project-model/src/types";

interface ChangePassportModalProps {
  passport: ProductionChangePassport;
  onApprove: (passportId: string) => void;
  onReject: (passportId: string) => void;
  onClose: () => void;
}

export const ChangePassportModal: React.FC<ChangePassportModalProps> = ({
  passport,
  onApprove,
  onReject,
  onClose
}) => {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none animate-in fade-in duration-200"
    >
      <div className="bg-[#0F1218] border border-[#262C36] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-16 border-b border-[#262C36] bg-[#12161F] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#D49B54]/15 border border-[#D49B54]/40 flex items-center justify-center text-[#D49B54]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-tight">Production Change Passport</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A202C] text-[#A0A7B2] border border-[#262C36]">
                  Scene {passport.sceneNumber}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  passport.humanDecision === "approved"
                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                    : passport.humanDecision === "rejected"
                    ? "bg-rose-950/60 text-rose-400 border border-rose-500/40"
                    : "bg-amber-950/60 text-amber-400 border border-amber-500/40"
                }`}>
                  {passport.humanDecision}
                </span>
              </div>
              <p className="text-[11px] text-[#A0A7B2] font-mono mt-0.5">
                Hash: {passport.beforeHash.slice(0, 8)}... → {passport.afterHash.slice(0, 8)}...
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-[#69717E] hover:text-white text-base">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#F0F2F5]">
          {/* Change Summary */}
          <div className="p-4 rounded-xl bg-[#141822] border border-[#262C36] space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#D49B54] font-bold">
              Screenplay AST Modification
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">
              "{passport.humanDiffSummary}"
            </p>
            <div className="flex items-center space-x-4 text-[11px] text-[#A0A7B2] pt-1">
              <span>Changed Entities: <strong className="text-white">{passport.changedEntities.join(", ") || "None"}</strong></span>
              <span>•</span>
              <span>Changed AST Nodes: <strong className="text-white">{passport.changedAstNodes.length}</strong></span>
            </div>
          </div>

          {/* Blast Radius: Affected vs Protected Artifacts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-[11px] font-mono uppercase">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Impacted Artifacts ({passport.affectedArtifactIds.length})</span>
              </div>
              <p className="text-[11px] text-[#A0A7B2]">Scheduled for selective recomputation:</p>
              <ul className="space-y-1 font-mono text-[10px] text-amber-200/90">
                {passport.affectedArtifactIds.map((id) => (
                  <li key={id} className="flex items-center space-x-1.5 truncate">
                    <span>⚡</span>
                    <span className="truncate">{id}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px] font-mono uppercase">
                <Lock className="w-3.5 h-3.5" />
                <span>Protected Unaffected ({passport.protectedArtifactIds.length})</span>
              </div>
              <p className="text-[11px] text-[#A0A7B2]">Zero tokens burned; cached state locked:</p>
              <ul className="space-y-1 font-mono text-[10px] text-emerald-200/90">
                {passport.protectedArtifactIds.slice(0, 5).map((id) => (
                  <li key={id} className="flex items-center space-x-1.5 truncate">
                    <span>🛡️</span>
                    <span className="truncate">{id}</span>
                  </li>
                ))}
                {passport.protectedArtifactIds.length > 5 && (
                  <li className="text-[#69717E] italic">+ {passport.protectedArtifactIds.length - 5} more protected nodes</li>
                )}
              </ul>
            </div>
          </div>

          {/* Reality Gate & Parallel Search Findings */}
          <div className="p-4 rounded-xl bg-[#141822] border border-[#262C36] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Reality Gate & External Grounding
                </span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                passport.realityGate.requiresExternalResearch
                  ? "bg-sky-950/60 text-sky-300 border border-sky-500/40"
                  : "bg-[#1E2430] text-[#A0A7B2]"
              }`}>
                {passport.realityGate.requiresExternalResearch ? "Parallel Search Triggered" : "Dramatic Dialogue (Gated)"}
              </span>
            </div>

            <p className="text-[11px] text-[#A0A7B2]">
              {passport.realityGate.reason}
            </p>

            {passport.parallelCitations.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-mono text-[#D49B54] uppercase font-bold">
                  Retrieved Live Sources ({passport.parallelCitations.length}):
                </div>
                <div className="space-y-1.5">
                  {passport.parallelCitations.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#0D1015] border border-[#262C36] flex items-start justify-between">
                      <div className="space-y-0.5 max-w-[85%]">
                        <div className="font-semibold text-white truncate">{c.title}</div>
                        <p className="text-[11px] text-[#A0A7B2] line-clamp-2">{c.snippet}</p>
                      </div>
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:text-sky-300 p-1 shrink-0"
                        title="Open Source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model & Agent Provenance */}
          <div className="p-3.5 rounded-xl bg-[#0D1015] border border-[#262C36] flex items-center justify-between text-[11px] text-[#A0A7B2] font-mono">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Engine: <strong className="text-white">{passport.provenance.adkVersion}</strong></span>
              <span>•</span>
              <span>Model: <strong className="text-white">{passport.provenance.model}</strong></span>
            </div>
            <div className="flex items-center space-x-3">
              <span>Latency: <strong className="text-white">{passport.provenance.latencyMs}ms</strong></span>
              <span>•</span>
              <span>Parallel: <strong className={passport.provenance.isLiveParallel ? "text-sky-400" : "text-amber-400"}>
                {passport.provenance.isLiveParallel ? "Live Cloud API" : "Grounded"}
              </strong></span>
            </div>
          </div>
        </div>

        {/* Footer Actions: Director Veto (Reject) vs Selective Reconciliation (Approve) */}
        <div className="h-16 border-t border-[#262C36] bg-[#12161F] px-6 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#A0A7B2]">
            Director approval governs all downstream node invalidations.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onReject(passport.id);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[#1A1F2A] hover:bg-rose-950/40 hover:text-rose-300 border border-[#262C36] hover:border-rose-500/40 text-[#A0A7B2] font-semibold flex items-center space-x-1.5 transition-all text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject (Zero Mutation)</span>
            </button>

            <button
              onClick={() => {
                onApprove(passport.id);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-[#D49B54] hover:bg-[#E3AF69] text-black font-bold flex items-center space-x-1.5 transition-all shadow-md text-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Selective Invalidation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

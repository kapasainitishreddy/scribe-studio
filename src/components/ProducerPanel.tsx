import React, { useMemo } from "react";
import {
  Settings,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  Flame,
  Moon,
  Users,
  CheckCircle2
} from "lucide-react";
import type { Project } from "../../packages/project-model/src/types";
import { calculateProductionLogistics } from "../../packages/production-engine/src/producerLogistics";

interface ProducerPanelProps {
  project: Project;
}

export const ProducerPanel: React.FC<ProducerPanelProps> = ({ project }) => {
  const logistics = useMemo(() => calculateProductionLogistics(project), [project]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-y-auto p-6 select-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#232730]">
        <div>
          <h2 className="text-base font-bold text-slate-200">Producer Agent — Production Impact & Logistics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational schedule formulas and risk assessment mapped directly from screenplay nodes.
          </p>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#13151e] border border-[#242938] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ESTIMATED PRINCIPAL PHOTOGRAPHY</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {logistics.estimatedShootingDays} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on ~3.5 industry page rate across {logistics.totalEstimatedPages} script pages.
          </p>
        </div>

        <div className="bg-[#13151e] border border-[#242938] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>LOCATION SETS</span>
            <MapPin className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-2 font-mono">
            {logistics.uniqueLocationCount} Locations
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {logistics.interiorSceneCount} Interior / {logistics.exteriorSceneCount} Exterior scenes.
          </p>
        </div>

        <div className="bg-[#13151e] border border-[#242938] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NIGHT CALLS</span>
            <Moon className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300 mt-2 font-mono">
            {logistics.nightShootCount} Nights
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {Math.round((logistics.nightShootCount / (logistics.totalScenes || 1)) * 100)}% of total call schedule.
          </p>
        </div>

        <div className="bg-[#13151e] border border-[#242938] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SPECIAL RISK CUES</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 font-mono">
            {logistics.stuntScenes.length + logistics.vfxSceneCount} Cues
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {logistics.stuntScenes.length} Stunt setups • {logistics.vfxSceneCount} VFX sequences.
          </p>
        </div>
      </div>

      {/* Cast Day Requirements Table */}
      <div className="bg-[#13151e] border border-[#242938] rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Cast Day Requirements (Scene Density)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {Object.entries(logistics.castDayRequirements).map(([castName, sceneCount]) => (
            <div key={castName} className="p-3 bg-[#0f1118] border border-[#222736] rounded-lg text-xs">
              <div className="font-bold text-slate-200">{castName}</div>
              <div className="text-slate-400 mt-1 flex items-center justify-between">
                <span>Scenes Scheduled:</span>
                <span className="font-mono text-amber-400 font-bold">{sceneCount} scenes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Factors & Recommendations */}
      <div className="bg-[#13151e] border border-[#242938] rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Production Risk & Complexity Factors</span>
        </h3>

        <ul className="space-y-2 text-xs text-slate-300">
          {logistics.riskFactors.map((rf, idx) => (
            <li key={idx} className="flex items-start space-x-2 p-2 rounded bg-[#0f1118] border border-[#222736]">
              <span className="text-amber-500 font-bold">•</span>
              <span>{rf}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

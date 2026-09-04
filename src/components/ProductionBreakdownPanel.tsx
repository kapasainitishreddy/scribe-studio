import React, { useState, useMemo } from "react";
import {
  Clapperboard,
  Lock,
  Unlock,
  Plus,
  FileDown,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Moon,
  Sun,
  MapPin,
  Flame
} from "lucide-react";
import type { BreakdownCategory, BreakdownElement, Project } from "../../packages/project-model/src/types";
import { calculateProductionLogistics } from "../../packages/production-engine/src/producerLogistics";

interface ProductionBreakdownPanelProps {
  project: Project;
  onToggleLock: (elementId: string) => void;
  onAddElement: (element: Omit<BreakdownElement, "id">) => void;
}

const CATEGORIES: BreakdownCategory[] = [
  "cast",
  "extras",
  "props",
  "wardrobe",
  "vehicles",
  "sfx",
  "vfx",
  "stunts",
  "animals",
  "makeup",
  "sound",
  "equipment",
  "set-dressing",
  "music",
  "greenery",
  "special"
];

export const ProductionBreakdownPanel: React.FC<ProductionBreakdownPanelProps> = ({
  project,
  onToggleLock,
  onAddElement
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BreakdownCategory | "all">("all");
  const [selectedScene, setSelectedScene] = useState<number | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState<BreakdownCategory>("props");
  const [newSceneNum, setNewSceneNum] = useState(1);

  const logistics = useMemo(() => calculateProductionLogistics(project), [project]);

  const filteredElements = project.breakdown.elements.filter((el) => {
    if (selectedCategory !== "all" && el.category !== selectedCategory) return false;
    if (selectedScene !== "all" && el.sceneNumber !== selectedScene) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddElement({
      sceneId: `scene-${newSceneNum}`,
      sceneNumber: newSceneNum,
      category: newCat,
      name: newName.trim(),
      isAiSuggested: false,
      isConfirmed: true,
      locked: true
    });
    setNewName("");
    setIsAddOpen(false);
  };

  const exportBreakdownCsv = () => {
    const headers = ["Scene", "Category", "Element Name", "Confirmed", "Locked"];
    const rows = project.breakdown.elements.map((e) => [
      e.sceneNumber,
      e.category.toUpperCase(),
      `"${e.name.replace(/"/g, '""')}"`,
      e.isConfirmed ? "YES" : "NO",
      e.locked ? "LOCKED" : "UNLOCKED"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${project.title.replace(/\s+/g, "_")}_PRODUCTION_BREAKDOWN.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0d10] overflow-hidden select-none">
      {/* Top Logistics Dashboard */}
      <div className="p-4 bg-[#111319] border-b border-[#232730] grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a]">
          <div className="text-slate-400 font-medium">Est. Shoot Days</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{logistics.estimatedShootingDays} Days</div>
          <div className="text-[10px] text-slate-500">~3.5 pages / day</div>
        </div>

        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a]">
          <div className="text-slate-400 font-medium">Locations</div>
          <div className="text-lg font-bold text-slate-200 mt-0.5">{logistics.uniqueLocationCount} Sets</div>
          <div className="text-[10px] text-slate-500">{logistics.interiorSceneCount} Int / {logistics.exteriorSceneCount} Ext</div>
        </div>

        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a]">
          <div className="text-slate-400 font-medium">Night Shoots</div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">{logistics.nightShootCount} Scenes</div>
          <div className="text-[10px] text-slate-500">
            {Math.round((logistics.nightShootCount / (logistics.totalScenes || 1)) * 100)}% of production
          </div>
        </div>

        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a]">
          <div className="text-slate-400 font-medium">Stunt Sequences</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">{logistics.stuntScenes.length} Stunts</div>
          <div className="text-[10px] text-slate-500">Scenes {logistics.stuntScenes.join(", ") || "None"}</div>
        </div>

        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a]">
          <div className="text-slate-400 font-medium">VFX Cues</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">{logistics.vfxSceneCount} Cues</div>
          <div className="text-[10px] text-slate-500">Post tracking needed</div>
        </div>

        <div className="p-2.5 bg-[#161822] rounded-lg border border-[#252a3a] flex flex-col justify-center items-center">
          <button
            onClick={exportBreakdownCsv}
            className="w-full py-1.5 px-2 bg-[#202535] hover:bg-[#2a3145] text-slate-200 rounded text-xs font-semibold border border-[#343d54] flex items-center justify-center space-x-1 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="h-11 border-b border-[#232730] bg-[#14161f] px-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-300">Category Filter:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-[#1c202c] border border-[#2c3244] rounded px-2.5 py-1 text-slate-200 text-xs outline-none"
          >
            <option value="all">All 16 Categories ({project.breakdown.elements.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()} ({project.breakdown.elements.filter((e) => e.category === c).length})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center space-x-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Breakdown Element</span>
          </button>
        </div>
      </div>

      {/* Elements Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-[#12141c] border border-[#242938] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-[#171a24] border-b border-[#242938] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 w-20">Scene</th>
                <th className="py-2.5 px-4 w-32">Category</th>
                <th className="py-2.5 px-4">Element Name</th>
                <th className="py-2.5 px-4 w-28">Source</th>
                <th className="py-2.5 px-4 w-24 text-right">Lock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {filteredElements.map((el) => (
                <tr key={el.id} className="hover:bg-[#181b26] transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-amber-400">
                    SCENE {el.sceneNumber}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#1f2433] text-indigo-300 font-mono text-[10px] uppercase font-bold">
                      {el.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-200">{el.name}</td>
                  <td className="py-2.5 px-4 text-[11px] text-slate-400">
                    {el.isAiSuggested ? (
                      <span className="text-slate-400">AI Suggested</span>
                    ) : (
                      <span className="text-emerald-400">User Defined</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => onToggleLock(el.id)}
                      className={`p-1 rounded border transition-colors ${
                        el.locked
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-[#181a24] text-slate-500 border-[#2b3042] hover:text-slate-300"
                      }`}
                      title={el.locked ? "Element is Locked Ground Truth" : "Click to Lock"}
                    >
                      {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#151720] border border-[#2d3447] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-200">Add Production Element</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Element Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Steadicam Rig or Thermal Flare"
                className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Scene Number</label>
                <input
                  type="number"
                  min={1}
                  value={newSceneNum}
                  onChange={(e) => setNewSceneNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#1c202c] border border-[#2d3447] rounded px-3 py-1.5 text-xs text-slate-200 outline-none"
                >
                </input>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#262c3d]">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold"
              >
                Save Element
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

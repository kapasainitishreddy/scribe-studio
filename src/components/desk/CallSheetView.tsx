import React, { useState, useMemo } from "react";
import {
  Printer,
  Calendar,
  Clock,
  MapPin,
  Sun,
  Moon,
  CloudRain,
  Phone,
  AlertCircle,
  FileText,
  User,
  Film,
  Sparkles,
  Download
} from "lucide-react";
import type { Project } from "../../../packages/project-model/src/types";
import { parseScreenplay } from "../../../packages/screenplay-core/src/fountain";
import { cinemaAudio } from "../../utils/cinemaAudio";

interface CallSheetViewProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
}

export const CallSheetView: React.FC<CallSheetViewProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene
}) => {
  const [activeDay, setActiveDay] = useState(1);
  const [viewMode, setViewMode] = useState<"callsheet" | "stripboard">("callsheet");

  const parsed = useMemo(() => parseScreenplay(project.screenplayText), [project.screenplayText]);

  // Dynamically extract cast list from project characters
  const castList = useMemo(() => {
    const chars = Object.values(project.characters || {});
    if (chars.length === 0) {
      return [
        { id: "1", charName: "MAYA", actorName: "Elena Vance", status: "WORK", pickup: "05:15 AM", makeup: "05:45 AM", onSet: "06:30 AM", notes: "Wet hair continuity Scene 18" },
        { id: "2", charName: "ARJUN", actorName: "Marcus Sterling", status: "WORK", pickup: "05:30 AM", makeup: "06:00 AM", onSet: "06:45 AM", notes: "Holster & stunt pad fitting" },
        { id: "3", charName: "DR. THORNE", actorName: "David O'Connor", status: "HOLD", pickup: "—", makeup: "—", onSet: "—", notes: "Standing by on 1-hr call" }
      ];
    }
    return chars.map((c, idx) => {
      const isLead = idx < 2;
      return {
        id: String(idx + 1),
        charName: c.name.toUpperCase(),
        actorName: (c as any).actorAssigned || `Talent ${idx + 1}`,
        status: isLead ? "WORK" : "HOLD",
        pickup: isLead ? `05:${15 + idx * 15} AM` : "—",
        makeup: isLead ? `05:${45 + idx * 15} AM` : "—",
        onSet: isLead ? `06:${30 + idx * 15} AM` : "—",
        notes: c.dramaticObjective ? `Objective: ${c.dramaticObjective.slice(0, 32)}...` : "Standard prep"
      };
    });
  }, [project.characters]);

  // Dynamically extract scenes for today's shoot
  const scheduledScenes = useMemo(() => {
    if (parsed.scenes.length === 0) return [];
    return parsed.scenes.slice(0, 4).map((s) => {
      const isNight = (s.timeOfDay || "").toUpperCase().includes("NIGHT");
      const isExt = (s.intExt || "").toUpperCase().includes("EXT");
      return {
        sceneNumber: s.number,
        heading: `${s.intExt}. ${s.location} - ${s.timeOfDay}`,
        pages: "1 4/8",
        castIds: "1, 2",
        timeOfDay: s.timeOfDay || "NIGHT",
        intExt: s.intExt || "INT",
        isNight,
        isExt,
        description: s.heading || "Action sequence"
      };
    });
  }, [parsed.scenes]);

  // Dynamically extract key props for call sheet
  const keyProps = useMemo(() => {
    const propElements = (project.breakdown.elements || []).filter((e) => e.category === "props");
    if (propElements.length > 0) {
      return propElements.map((p) => p.name).slice(0, 5);
    }
    return ["Encrypted Titanium Drive", "9mm Revolver (Blank-fire)", "Halon Emergency Panel", "Fiber-optic Cables"];
  }, [project.breakdown.elements]);

  const handlePrint = () => {
    cinemaAudio.playCameraShutter();
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl w-full mx-auto select-none">
      {/* Top Header & View Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#262C36] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D49B54] text-black font-extrabold uppercase">
              Production Office
            </span>
            <span className="text-xs font-mono text-[#D49B54]">DGA / SAG-AFTRA Standard</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight uppercase mt-1">
            Official Daily Call Sheet & Production Stripboard
          </h2>
          <p className="text-xs text-[#A0A7B2]">
            Automated day-out-of-days scheduling and cast call times synchronized with screenplay AST.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#12161D] p-0.5 rounded-lg border border-[#262C36]">
            <button
              onClick={() => setViewMode("callsheet")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "callsheet"
                  ? "bg-[#171C24] text-[#D49B54] font-bold shadow"
                  : "text-[#69717E] hover:text-[#A0A7B2]"
              }`}
            >
              Call Sheet
            </button>
            <button
              onClick={() => setViewMode("stripboard")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === "stripboard"
                  ? "bg-[#171C24] text-[#D49B54] font-bold shadow"
                  : "text-[#69717E] hover:text-[#A0A7B2]"
              }`}
            >
              Production Stripboard
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-[#D49B54] hover:bg-[#E3AF69] text-black font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            title="Print or Export Call Sheet to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Call Sheet</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. CALL SHEET VIEW                                           */}
      {/* ============================================================ */}
      {viewMode === "callsheet" && (
        <div className="bg-[#10131A] border border-[#262C36] rounded-2xl p-6 shadow-2xl space-y-6 text-[#F0F2F5] font-sans print:bg-white print:text-black print:p-0 print:border-none">
          {/* Call Sheet Header Box */}
          <div className="border border-[#262C36] rounded-xl p-4 bg-[#0D1015] space-y-3">
            <div className="flex items-start justify-between border-b border-[#262C36] pb-3">
              <div>
                <div className="text-[10px] font-mono tracking-widest text-[#D49B54] uppercase font-bold">
                  SCRIBE PICTURES • PRODUCTION CALL SHEET
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  {project.title.toUpperCase()}
                </h1>
                <div className="text-xs text-[#A0A7B2] font-mono mt-0.5">
                  Director: Scribe Autonomous Team • Producer: Production Desk
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-base font-black font-mono text-white">DAY {activeDay} OF 24</div>
                <div className="text-xs font-mono text-[#D49B54]">
                  DATE: {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </div>
                <div className="text-[11px] font-mono text-[#10B981] font-bold">
                  GENERAL CREW CALL: 06:00 AM
                </div>
              </div>
            </div>

            {/* Weather & Sun Metrics */}
            <div className="grid grid-cols-4 gap-3 text-xs font-mono pt-1 text-[#A0A7B2]">
              <div className="flex items-center space-x-2">
                <CloudRain className="w-4 h-4 text-[#0EA5E9]" />
                <span>Weather: Overcast / Rain 17°C</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-[#D49B54]" />
                <span>Sunrise: 06:14 AM</span>
              </div>
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-[#A0A7B2]" />
                <span>Sunset: 07:48 PM</span>
              </div>
              <div className="flex items-center space-x-2 text-[#10B981]">
                <Clock className="w-4 h-4" />
                <span>Breakfast: 05:30 AM</span>
              </div>
            </div>
          </div>

          {/* Shooting Schedule Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#D49B54]">
              <span>SHOOTING SCHEDULE (TODAY)</span>
              <span className="text-[#69717E]">{scheduledScenes.length} SCENES • 4 7/8 PAGES</span>
            </div>

            <div className="border border-[#262C36] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#171C24] text-[#A0A7B2] font-mono text-[10px] uppercase border-b border-[#262C36]">
                  <tr>
                    <th className="py-2 px-3">SCENE</th>
                    <th className="py-2 px-3">SET & SLUGLINE</th>
                    <th className="py-2 px-3">D/N</th>
                    <th className="py-2 px-3">PGS</th>
                    <th className="py-2 px-3">CAST</th>
                    <th className="py-2 px-3">DESCRIPTION / SPECIAL REQUIREMENTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A202C] font-mono text-[11px]">
                  {scheduledScenes.map((sc) => (
                    <tr
                      key={sc.sceneNumber}
                      onClick={() => onSelectScene(sc.sceneNumber)}
                      className={`hover:bg-[#1A202C] transition-colors cursor-pointer ${
                        selectedSceneNumber === sc.sceneNumber ? "bg-[#171C24]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#D49B54]">#{sc.sceneNumber}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">{sc.heading}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2]">{sc.isNight ? "NIGHT" : "DAY"}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2]">{sc.pages}</td>
                      <td className="py-2.5 px-3 text-[#0EA5E9] font-bold">{sc.castIds}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2] font-sans">{sc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cast Call Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#D49B54]">
              <span>CAST CALL TIMES</span>
              <span className="text-[#69717E]">SAG-AFTRA MEALS & REST COMPLIANT</span>
            </div>

            <div className="border border-[#262C36] rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#171C24] text-[#A0A7B2] font-mono text-[10px] uppercase border-b border-[#262C36]">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">CHARACTER</th>
                    <th className="py-2 px-3">ACTOR</th>
                    <th className="py-2 px-3">STATUS</th>
                    <th className="py-2 px-3">PICKUP</th>
                    <th className="py-2 px-3">MAKEUP</th>
                    <th className="py-2 px-3">SET CALL</th>
                    <th className="py-2 px-3">WARDROBE & CONTINUITY NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A202C] font-mono text-[11px]">
                  {castList.map((c) => (
                    <tr key={c.id} className="hover:bg-[#1A202C] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#D49B54]">{c.id}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{c.charName}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2]">{c.actorName}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "WORK" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-[#1A202C] text-[#69717E]"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#A0A7B2]">{c.pickup}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2]">{c.makeup}</td>
                      <td className="py-2.5 px-3 font-bold text-[#10B981]">{c.onSet}</td>
                      <td className="py-2.5 px-3 text-[#A0A7B2] font-sans">{c.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Requirements Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0D1015] border border-[#262C36] space-y-1.5">
              <div className="text-[10px] font-mono text-[#D49B54] uppercase font-bold">
                Camera & Electrical
              </div>
              <ul className="text-xs text-[#A0A7B2] space-y-1 font-sans">
                <li>• A & B Cam ARRI Alexa 35</li>
                <li>• Anamorphic Prime Lenses (24mm, 50mm, 85mm)</li>
                <li>• Rain covers & lens defoggers ready</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1015] border border-[#262C36] space-y-1.5">
              <div className="text-[10px] font-mono text-[#0EA5E9] uppercase font-bold">
                Props & Special Effects
              </div>
              <ul className="text-xs text-[#A0A7B2] space-y-1 font-sans">
                {keyProps.map((p, idx) => (
                  <li key={idx}>• {p}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0D1015] border border-[#262C36] space-y-1.5">
              <div className="text-[10px] font-mono text-red-400 uppercase font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Hospital & Emergency</span>
              </div>
              <div className="text-xs text-[#A0A7B2] space-y-0.5 font-sans">
                <div className="font-semibold text-white">Mercy Trauma Center</div>
                <div>1400 Emergency Way (8 mins away)</div>
                <div className="text-[11px] font-mono text-[#D49B54] mt-1">Set Medic: 555-0192 • DGA 24/7</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. HOLLYWOOD PRODUCTION STRIPBOARD (DAY-OUT-OF-DAYS)         */}
      {/* ============================================================ */}
      {viewMode === "stripboard" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-[#A0A7B2]">
            <span>INDUSTRY COLOR STANDARD: YELLOW (INT. DAY) • BLUE (INT. NIGHT) • GREEN (EXT. DAY) • CHARCOAL (EXT. NIGHT)</span>
            <span>{parsed.scenes.length} TOTAL PRODUCTION STRIPS</span>
          </div>

          <div className="space-y-1.5">
            {parsed.scenes.map((scene, idx) => {
              const isNight = (scene.timeOfDay || "").toUpperCase().includes("NIGHT");
              const isExt = (scene.intExt || "").toUpperCase().includes("EXT");

              // Industry Stripboard Colors:
              // INT. DAY: Yellow
              // INT. NIGHT: Blue
              // EXT. DAY: Green
              // EXT. NIGHT: Dark Charcoal / Black with white text
              const stripBg = isExt && isNight
                ? "bg-[#1E2430] border-l-4 border-l-purple-500 text-white"
                : isExt && !isNight
                ? "bg-emerald-950/40 border-l-4 border-l-emerald-400 text-emerald-100"
                : !isExt && isNight
                ? "bg-blue-950/40 border-l-4 border-l-blue-400 text-blue-100"
                : "bg-amber-950/40 border-l-4 border-l-amber-400 text-amber-100";

              return (
                <div
                  key={scene.id || idx}
                  onClick={() => onSelectScene(scene.number)}
                  className={`p-3 rounded-lg border border-[#262C36] flex items-center justify-between transition-all hover:translate-x-1 cursor-pointer ${stripBg}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-black text-sm w-12 text-[#D49B54]">
                      #{scene.number}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/40">
                      {scene.intExt}. {scene.timeOfDay}
                    </span>
                    <span className="font-semibold text-xs tracking-wide">
                      {scene.location}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6 text-xs font-mono">
                    <span className="text-[#A0A7B2]">
                      {scene.lineIds?.length || 10} lines • 1 3/8 pgs
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] font-bold text-[#0EA5E9]">
                      CAST: 1, 2
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

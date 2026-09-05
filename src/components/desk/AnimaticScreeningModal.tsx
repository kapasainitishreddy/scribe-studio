import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Camera,
  Film,
  Sparkles,
  Sliders,
  Download,
  Video,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import type { Project, StoryboardPanel } from "../../../packages/project-model/src/types";
import { generatePanelSvgSchematic } from "../../../packages/production-engine/src/storyboardGenerator";
import {
  renderAnimaticVideo,
  checkBrowserVideoCapabilities,
  type AnimaticExportProgress,
  type VideoCapabilityStatus
} from "../../../packages/production-engine/src/animaticExporter";
import { cinemaAudio } from "../../utils/cinemaAudio";

interface AnimaticScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneNumber: number;
  sceneSlugline: string;
  panels: StoryboardPanel[];
  project: Project;
}

export const AnimaticScreeningModal: React.FC<AnimaticScreeningModalProps> = ({
  isOpen,
  onClose,
  sceneNumber,
  sceneSlugline,
  panels,
  project
}) => {
  if (!isOpen || panels.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1.0 | 1.5 | 0.75>(1.0);
  const [isMuted, setIsMuted] = useState(cinemaAudio.getIsMuted());
  const [frameCounter, setFrameCounter] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<AnimaticExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<VideoCapabilityStatus | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const activePanel = panels[currentIndex] || panels[0];

  // Inspect video capabilities on mount
  useEffect(() => {
    checkBrowserVideoCapabilities().then(setCapabilities);
  }, []);

  // Duration per panel based on dialogue length + speed
  const panelDurationMs = useMemo(() => {
    const dialogueWords = (activePanel?.dialogue || "").split(/\s+/).filter(Boolean).length;
    const baseSeconds = dialogueWords > 0 ? Math.max(3.5, dialogueWords * 0.45) : 3.0;
    return Math.round((baseSeconds * 1000) / speed);
  }, [activePanel, speed]);

  // Ambient soundscape handling
  useEffect(() => {
    if (isPlaying && !isExporting) {
      cinemaAudio.startAmbientRoomTone();
    } else {
      cinemaAudio.stopAmbientRoomTone();
    }
    return () => {
      cinemaAudio.stopAmbientRoomTone();
    };
  }, [isPlaying, isExporting]);

  // 24 FPS Timecode Counter
  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();

    const updateFrames = (time: number) => {
      if (isPlaying && !isExporting && time - lastTime >= 1000 / 24) {
        setFrameCounter((prev) => prev + 1);
        lastTime = time;
      }
      frameId = requestAnimationFrame(updateFrames);
    };

    frameId = requestAnimationFrame(updateFrames);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isExporting]);

  // Playhead timer
  useEffect(() => {
    if (!isPlaying || isExporting) return;

    const timer = setTimeout(() => {
      if (currentIndex < panels.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        cinemaAudio.playCameraShutter();
      } else {
        setIsPlaying(false);
      }
    }, panelDurationMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, panels.length, panelDurationMs, isExporting]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isExporting) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentIndex < panels.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          cinemaAudio.playCameraShutter();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          cinemaAudio.playCameraShutter();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, panels.length, onClose, isExporting]);

  // Format 24 FPS timecode
  const timecodeString = useMemo(() => {
    const totalSeconds = Math.floor(frameCounter / 24);
    const frames = frameCounter % 24;
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `01:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
  }, [frameCounter]);

  // Dynamic camera motion
  const cameraMovement = (activePanel?.cameraMovement || "").toLowerCase();
  const motionStyle = useMemo(() => {
    if (!isPlaying || isExporting) return {};
    if (cameraMovement.includes("dolly") || cameraMovement.includes("zoom") || cameraMovement.includes("in")) {
      return {
        transform: "scale(1.12)",
        transition: `transform ${panelDurationMs}ms cubic-bezier(0.25, 1, 0.5, 1)`
      };
    }
    if (cameraMovement.includes("pan") || cameraMovement.includes("track")) {
      return {
        transform: "scale(1.08) translateX(-3%)",
        transition: `transform ${panelDurationMs}ms linear`
      };
    }
    if (cameraMovement.includes("tilt") || cameraMovement.includes("crane")) {
      return {
        transform: "scale(1.08) translateY(-4%)",
        transition: `transform ${panelDurationMs}ms linear`
      };
    }
    return {
      transform: "scale(1.05)",
      transition: `transform ${panelDurationMs}ms ease-out`
    };
  }, [isPlaying, cameraMovement, panelDurationMs, currentIndex, isExporting]);

  const svgContent = useMemo(() => {
    return generatePanelSvgSchematic(activePanel);
  }, [activePanel]);

  const handleToggleMute = () => {
    const muted = cinemaAudio.toggleMute();
    setIsMuted(muted);
  };

  // Real Mediabunny Video Export Trigger
  const handleExportVideo = async (format: "mp4" | "webm", resolution: "1080p" | "720p") => {
    setIsExportMenuOpen(false);
    setIsPlaying(false);
    setIsExporting(true);
    setExportError(null);
    setExportProgress({
      stage: "Preparing frames",
      percentage: 2,
      currentFrame: 0,
      totalFrames: 100,
      message: "Initializing Mediabunny WebCodecs video canvas..."
    });

    try {
      cinemaAudio.playCameraShutter();
      const result = await renderAnimaticVideo(project, sceneNumber, panels, {
        resolution,
        format,
        fps: 24,
        includeSubtitles: true,
        includeTechnicalHUD: true,
        onProgress: (p) => setExportProgress(p)
      });

      // Download file to disk
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      cinemaAudio.playDirectorChime(true);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(null);
      }, 1200);
    } catch (err: any) {
      console.error("Mediabunny export failed:", err);
      setExportError(err?.message || "Failed to encode animatic video.");
      cinemaAudio.playDirectorChime(false);
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#050608] text-[#F0F2F5] select-none animate-in fade-in duration-200"
    >
      {/* 1. TOP CINEMA HEADER */}
      <div className="h-12 border-b border-[#1A202C] bg-[#090B0E]/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-red-400 font-extrabold">
            {isPlaying ? "REC • 24.00 FPS" : "PAUSED • 24.00 FPS"}
          </span>
          <span className="text-[#3A4454]">|</span>
          <span className="text-xs font-bold text-white font-mono">
            SCENE {sceneNumber} — {sceneSlugline}
          </span>
        </div>

        {/* HUD Center Readout */}
        <div className="flex items-center space-x-4 font-mono text-xs">
          <span className="text-[#D49B54] font-bold tracking-wider">{timecodeString}</span>
          <span className="px-2 py-0.5 rounded bg-[#1A202C] text-[#A0A7B2] text-[10px]">
            SHOT {currentIndex + 1} / {panels.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1A202C] text-[#A0A7B2] text-[10px]">
            {activePanel.lensSuggestion || "24mm"} ANAMORPHIC
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3 relative">
          {/* Mediabunny Video Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#D49B54] hover:bg-[#E3AF69] text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              title="Export scene animatic as real MP4 or WebM video file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Video</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#12161D] border border-[#262C36] shadow-2xl p-2 z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 border-b border-[#262C36] text-[10px] font-mono text-[#A0A7B2] uppercase font-bold">
                  Mediabunny Video Encoder (MPL-2.0)
                </div>

                <button
                  onClick={() => handleExportVideo("mp4", "1080p")}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#171C24] text-xs text-white font-medium flex items-center justify-between"
                >
                  <span>MP4 (1080p DCI Scope)</span>
                  <span className="text-[10px] font-mono text-[#D49B54] font-bold">H.264</span>
                </button>

                <button
                  onClick={() => handleExportVideo("mp4", "720p")}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#171C24] text-xs text-[#A0A7B2] hover:text-white flex items-center justify-between"
                >
                  <span>MP4 (720p Fast)</span>
                  <span className="text-[10px] font-mono text-[#69717E]">H.264</span>
                </button>

                <button
                  onClick={() => handleExportVideo("webm", "1080p")}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[#171C24] text-xs text-[#A0A7B2] hover:text-white flex items-center justify-between"
                >
                  <span>WebM (1080p Scope)</span>
                  <span className="text-[10px] font-mono text-[#0EA5E9]">VP8</span>
                </button>

                {capabilities?.reason && (
                  <div className="p-1.5 text-[9px] font-mono text-amber-300 bg-amber-950/40 rounded border border-amber-500/30">
                    ℹ️ {capabilities.reason}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded hover:bg-[#1A202C] text-[#A0A7B2] hover:text-white transition-colors"
            title={isMuted ? "Unmute Cinema Sound" : "Mute Cinema Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#D49B54]" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-red-500/20 text-[#A0A7B2] hover:text-red-400 transition-colors"
            title="Exit Screening Room (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN ANAMORPHIC 2.39:1 PROJECTION CANVAS */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-black">
        {/* Optical Cinema Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90 z-10" />

        {/* 2.39:1 Aspect Ratio Screen Box */}
        <div
          className="relative w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl border border-[#1A202C] bg-[#090B0E] flex flex-col items-center justify-center"
          style={{ aspectRatio: "2.39 / 1" }}
        >
          {/* Animated SVG Schematic */}
          <div
            className="w-full h-full flex items-center justify-center overflow-hidden transform-gpu"
            style={motionStyle}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {/* Subtitle Overlay */}
          {activePanel?.dialogue && (
            <div className="absolute bottom-6 inset-x-12 z-20 flex flex-col items-center text-center pointer-events-none">
              <div className="bg-black/85 backdrop-blur-md px-5 py-2 rounded-lg border border-white/10 max-w-2xl shadow-2xl">
                {activePanel.charactersVisible?.length > 0 && (
                  <div className="text-[10px] font-mono tracking-widest uppercase text-[#D49B54] font-bold mb-0.5">
                    {activePanel.charactersVisible[0]}
                  </div>
                )}
                <div className="text-sm font-editorial text-white tracking-wide leading-snug drop-shadow-md">
                  "{activePanel.dialogue}"
                </div>
              </div>
            </div>
          )}

          {/* Technical Specs Corner HUD */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none font-mono text-[10px] space-y-0.5 text-white/70 drop-shadow">
            <div className="flex items-center space-x-2">
              <span className="text-[#D49B54] font-bold">{activePanel.shotType?.toUpperCase() || "CU"}</span>
              <span>•</span>
              <span>{activePanel.cameraMovement || "Slow Dolly In"}</span>
            </div>
            <div className="text-[#A0A7B2]">T1.9 • 180° SHUTTER • 800 ISO</div>
          </div>

          <div className="absolute top-4 right-4 z-20 pointer-events-none font-mono text-[10px] text-right space-y-0.5 text-white/70 drop-shadow">
            <div className="text-[#0EA5E9] font-bold">2.39:1 DCI SCOPE</div>
            <div className="text-[#A0A7B2]">{activePanel.lightingIntent || "High Contrast Anamorphic"}</div>
          </div>
        </div>
      </div>

      {/* 3. VIDEO EXPORT PROGRESS MODAL OVERLAY */}
      {isExporting && exportProgress && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#12161F] border border-[#262C36] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-[#D49B54]/15 border border-[#D49B54]/40 flex items-center justify-center text-[#D49B54]">
                <Video className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">
                  Exporting Animatic Video
                </div>
                <div className="text-[11px] font-mono text-[#D49B54]">
                  Mediabunny WebCodecs Pipeline • {exportProgress.stage}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#A0A7B2]">{exportProgress.message}</span>
                <span className="font-bold text-white">{exportProgress.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1A202C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D49B54] to-[#F59E0B] transition-all duration-200"
                  style={{ width: `${exportProgress.percentage}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-[#69717E] flex justify-between">
                <span>Frame {exportProgress.currentFrame} of {exportProgress.totalFrames}</span>
                <span>24.00 FPS • 2.39:1 DCI Scope</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPORT ERROR MODAL */}
      {exportError && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#12161F] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <div className="text-sm font-bold text-white">Video Export Incompatibility</div>
            </div>
            <p className="text-xs text-[#A0A7B2] leading-relaxed">
              {exportError}
            </p>
            <div className="text-[11px] font-mono text-[#69717E] bg-black/40 p-2.5 rounded-lg border border-[#262C36]">
              Note: Mediabunny requires modern browser hardware video encoders (Chrome 94+, Edge 94+, Safari 16.4+). You can also try exporting in WebM format.
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setExportError(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1A202C] hover:bg-[#222938] text-xs font-semibold text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CINEMA CONTROLS & TIMELINE SCRUBBER */}
      <div className="h-20 border-t border-[#1A202C] bg-[#090B0E] px-8 flex flex-col justify-center space-y-2 z-20">
        {/* Progress Bar */}
        <div className="flex items-center space-x-2">
          {panels.map((panel, idx) => (
            <button
              key={panel.id || idx}
              onClick={() => {
                setCurrentIndex(idx);
                cinemaAudio.playCameraShutter();
              }}
              className="flex-1 h-2 rounded-full overflow-hidden transition-all duration-200 cursor-pointer relative group"
              style={{
                backgroundColor: idx === currentIndex ? "#D49B54" : idx < currentIndex ? "#3A4454" : "#1A202C"
              }}
              title={`Shot ${idx + 1}: ${panel.shotType || "Panel"}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#A0A7B2]">
            <span>Speed:</span>
            {([0.75, 1.0, 1.5] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  speed === s ? "bg-[#D49B54] text-black font-bold" : "hover:bg-[#1A202C] text-[#A0A7B2]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (currentIndex > 0) {
                  setCurrentIndex((prev) => prev - 1);
                  cinemaAudio.playCameraShutter();
                }
              }}
              disabled={currentIndex === 0}
              className="p-2 rounded-full hover:bg-[#1A202C] disabled:opacity-30 disabled:hover:bg-transparent text-white transition-colors"
              title="Previous Shot (Left Arrow)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-[#D49B54] hover:bg-[#E3AF69] text-black flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
              title="Play / Pause (Space)"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (currentIndex < panels.length - 1) {
                  setCurrentIndex((prev) => prev + 1);
                  cinemaAudio.playCameraShutter();
                }
              }}
              disabled={currentIndex === panels.length - 1}
              className="p-2 rounded-full hover:bg-[#1A202C] disabled:opacity-30 disabled:hover:bg-transparent text-white transition-colors"
              title="Next Shot (Right Arrow)"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-mono text-[#69717E]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#1A202C] text-white text-[10px]">Space</kbd> to toggle •{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#1A202C] text-white text-[10px]">←</kbd> /{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#1A202C] text-white text-[10px]">→</kbd> to step
          </div>
        </div>
      </div>
    </div>
  );
};

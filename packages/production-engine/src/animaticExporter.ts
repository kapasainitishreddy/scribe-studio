/**
 * Scribe Studio Animatic Video Exporter
 * Powered by Mediabunny (MPL-2.0)
 * Uses native WebCodecs + CanvasSource to export real MP4 and WebM video files
 * from storyboard panels and editorial timelines.
 */

import {
  Output,
  CanvasSource,
  Mp4OutputFormat,
  MkvOutputFormat,
  BufferTarget
} from "mediabunny";
import type {
  Project,
  StoryboardPanel,
  EditorialTimeline,
  EditorialTrack,
  EditorialClip
} from "../../project-model/src/types";

export interface AnimaticExportOptions {
  resolution: "1080p" | "720p";
  format: "mp4" | "webm";
  fps?: number;
  includeSubtitles?: boolean;
  includeTechnicalHUD?: boolean;
  onProgress?: (progress: AnimaticExportProgress) => void;
}

export interface AnimaticExportProgress {
  stage: "Preparing frames" | "Encoding" | "Muxing" | "Finalizing";
  percentage: number;
  currentFrame: number;
  totalFrames: number;
  message: string;
}

export interface AnimaticExportResult {
  blob: Blob;
  filename: string;
  durationSeconds: number;
  format: "mp4" | "webm";
  timeline: EditorialTimeline;
  resolution: { width: number; height: number };
}

export interface VideoCapabilityStatus {
  supported: boolean;
  canExportMp4: boolean;
  canExportWebm: boolean;
  reason?: string;
}

/**
 * Truthfully inspect whether the browser runtime supports WebCodecs video encoding.
 */
export async function checkBrowserVideoCapabilities(): Promise<VideoCapabilityStatus> {
  if (typeof window === "undefined" || typeof (window as any).VideoEncoder === "undefined") {
    return {
      supported: false,
      canExportMp4: false,
      canExportWebm: false,
      reason: "WebCodecs VideoEncoder API is not available in this browser environment."
    };
  }

  const VideoEncoderClass = (window as any).VideoEncoder;
  let canMp4 = false;
  let canWebm = false;

  try {
    if (typeof VideoEncoderClass.isConfigSupported === "function") {
      const mp4Check = await VideoEncoderClass.isConfigSupported({
        codec: "avc1.4d002a", // H.264 Main Profile Level 4.2
        width: 1920,
        height: 804,
        bitrate: 4_000_000,
        framerate: 24
      });
      canMp4 = Boolean(mp4Check && mp4Check.supported);

      const webmCheck = await VideoEncoderClass.isConfigSupported({
        codec: "vp8",
        width: 1920,
        height: 804,
        bitrate: 4_000_000,
        framerate: 24
      });
      canWebm = Boolean(webmCheck && webmCheck.supported);
    } else {
      canMp4 = true;
      canWebm = true;
    }
  } catch (err: any) {
    return {
      supported: false,
      canExportMp4: false,
      canExportWebm: false,
      reason: `Hardware encoder check failed: ${err?.message || "Unknown error"}`
    };
  }

  return {
    supported: canMp4 || canWebm,
    canExportMp4: canMp4,
    canExportWebm: canWebm,
    reason: !canMp4 && !canWebm ? "Neither H.264 nor VP8 hardware encoding configurations are supported." : undefined
  };
}

/**
 * Build a structured EditorialTimeline domain model from a scene's storyboard sequence.
 */
export function buildEditorialTimelineForScene(
  project: Project,
  sceneNumber: number,
  fps: number = 24
): EditorialTimeline {
  const sequence = project.storyboardSequences?.[sceneNumber];
  const panels: StoryboardPanel[] = sequence?.panels || [];

  let currentFrame = 0;
  const videoClips: EditorialClip[] = [];
  const subtitleClips: EditorialClip[] = [];

  panels.forEach((panel, idx) => {
    const dialogueWords = (panel.dialogue || "").split(/\s+/).filter(Boolean).length;
    // Base duration: 3.0 seconds, scaled by dialogue length
    const durationSeconds = dialogueWords > 0 ? Math.max(3.0, dialogueWords * 0.45) : 2.5;
    const durationFrames = Math.round(durationSeconds * fps);

    const isStale = panel.status === "OUTDATED";

    // Video Clip
    videoClips.push({
      id: `clip-v-${panel.id || idx}`,
      name: `Shot ${idx + 1} [${panel.shotType || "CU"}]`,
      sceneNumber,
      beatId: panel.beatId,
      shotId: panel.id,
      storyboardPanelId: panel.id,
      startFrame: currentFrame,
      durationFrames,
      durationSeconds,
      mediaType: "canvas-schematic",
      status: isStale ? "OUTDATED" : panel.status === "APPROVED" ? "APPROVED" : "DRAFT",
      metadata: {
        lens: panel.lensSuggestion || "24mm Anamorphic",
        shotType: panel.shotType || "CU",
        cameraMovement: panel.cameraMovement || "Static",
        dialogueText: panel.dialogue,
        charactersVisible: panel.charactersVisible,
        isStale,
        hash: `panel-${panel.panelNumber}-rev${panel.version || 1}`
      }
    });

    // Subtitle Clip
    if (panel.dialogue) {
      subtitleClips.push({
        id: `clip-sub-${panel.id || idx}`,
        name: `Sub: ${panel.charactersVisible?.[0] || "Dialogue"}`,
        sceneNumber,
        beatId: panel.beatId,
        shotId: panel.id,
        storyboardPanelId: panel.id,
        startFrame: currentFrame,
        durationFrames,
        durationSeconds,
        mediaType: "text-subtitle",
        status: "APPROVED",
        metadata: {
          dialogueText: panel.dialogue,
          speaker: panel.charactersVisible?.[0] || "CHARACTER"
        }
      });
    }

    currentFrame += durationFrames;
  });

  const totalDurationFrames = currentFrame;
  const totalDurationSeconds = totalDurationFrames / fps;

  const tracks: EditorialTrack[] = [
    {
      id: "track-v1",
      name: "V1 — Storyboard Visuals",
      kind: "video",
      clips: videoClips
    },
    {
      id: "track-sub1",
      name: "SUB1 — Dialogue Subtitles",
      kind: "subtitles",
      clips: subtitleClips
    }
  ];

  return {
    id: `timeline-sc${sceneNumber}-${Date.now()}`,
    projectId: project.id,
    sceneNumber,
    revisionId: project.revisions?.[0]?.id || "rev-latest",
    fps,
    timecodeStart: "01:00:00:00",
    totalDurationFrames,
    totalDurationSeconds,
    tracks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Render and encode real MP4 or WebM video file using Mediabunny.
 */
export async function renderAnimaticVideo(
  project: Project,
  sceneNumber: number,
  panels: StoryboardPanel[],
  options: AnimaticExportOptions
): Promise<AnimaticExportResult> {
  const fps = options.fps || 24;
  const timeline = buildEditorialTimelineForScene(project, sceneNumber, fps);

  // 2.39:1 DCI Scope Dimensions
  const width = options.resolution === "1080p" ? 1920 : 1280;
  const height = options.resolution === "1080p" ? 804 : 536;

  options.onProgress?.({
    stage: "Preparing frames",
    percentage: 5,
    currentFrame: 0,
    totalFrames: timeline.totalDurationFrames,
    message: `Constructing ${options.resolution} timeline (${timeline.totalDurationFrames} frames at ${fps} fps)...`
  });

  // Verify capabilities before running encoder
  const caps = await checkBrowserVideoCapabilities();
  if (!caps.supported) {
    throw new Error(
      caps.reason ||
        "Browser WebCodecs video encoding is unavailable. Please use a modern browser (Chrome 94+, Edge 94+, Firefox 130+, Safari 16.4+) supporting WebCodecs."
    );
  }

  const chosenFormat = options.format === "mp4" && caps.canExportMp4 ? "mp4" : "webm";
  const codec: "avc" | "vp8" = chosenFormat === "mp4" ? "avc" : "vp8";

  // Create canvas for rendering frames
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  } else if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  } else {
    throw new Error("Canvas rendering context unavailable in current execution environment.");
  }

  // Setup Mediabunny Output & CanvasSource
  const target = new BufferTarget();
  const outputFormat = chosenFormat === "mp4" ? new Mp4OutputFormat() : new MkvOutputFormat();
  const output = new Output({
    format: outputFormat,
    target
  });

  const canvasSource = new CanvasSource(canvas as any, {
    codec,
    bitrate: options.resolution === "1080p" ? 4_500_000 : 2_500_000
  });

  output.addVideoTrack(canvasSource);
  await output.start();

  const totalFrames = timeline.totalDurationFrames;
  let frameIndex = 0;

  const videoTrack = timeline.tracks.find((t) => t.kind === "video");
  const clips = videoTrack?.clips || [];

  for (let cIdx = 0; cIdx < clips.length; cIdx++) {
    const clip = clips[cIdx];
    const panel = panels.find((p) => p.id === clip.storyboardPanelId) || panels[cIdx];

    const clipStartFrame = clip.startFrame;
    const clipDurationFrames = clip.durationFrames;

    for (let f = 0; f < clipDurationFrames; f++) {
      const overallFrame = clipStartFrame + f;
      const progressFraction = f / clipDurationFrames;

      // Draw canvas frame
      renderFrameToCanvas(ctx, width, height, panel, clip, progressFraction, overallFrame, fps, options);

      // Add frame to Mediabunny CanvasSource (timestamp in seconds, duration in seconds)
      const timestampSeconds = overallFrame / fps;
      const frameDurationSeconds = 1 / fps;
      await canvasSource.add(timestampSeconds, frameDurationSeconds);

      frameIndex++;

      // Progress reporting
      if (frameIndex % 6 === 0 || frameIndex === totalFrames) {
        const percent = Math.min(90, Math.round(10 + (frameIndex / totalFrames) * 80));
        options.onProgress?.({
          stage: "Encoding",
          percentage: percent,
          currentFrame: frameIndex,
          totalFrames,
          message: `Encoding frame ${frameIndex} of ${totalFrames} (${chosenFormat.toUpperCase()})...`
        });
      }
    }
  }

  options.onProgress?.({
    stage: "Muxing",
    percentage: 92,
    currentFrame: totalFrames,
    totalFrames,
    message: "Muxing video tracks and writing container metadata..."
  });

  // Finalize video container
  await output.finalize();

  options.onProgress?.({
    stage: "Finalizing",
    percentage: 100,
    currentFrame: totalFrames,
    totalFrames,
    message: "Video compilation complete."
  });

  const buffer = target.buffer;
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("Mediabunny output buffer is empty after finalization.");
  }

  const mimeType = chosenFormat === "mp4" ? "video/mp4" : "video/webm";
  const blob = new Blob([buffer], { type: mimeType });

  const filename = `SCRIBE_SCENE_${sceneNumber}_ANIMATIC_${options.resolution}.${chosenFormat}`;

  return {
    blob,
    filename,
    durationSeconds: timeline.totalDurationSeconds,
    format: chosenFormat,
    timeline,
    resolution: { width, height }
  };
}

/**
 * Draw a single cinema frame to the 2D canvas context.
 */
function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  panel: StoryboardPanel | undefined,
  clip: EditorialClip,
  progress: number,
  frameNumber: number,
  fps: number,
  options: AnimaticExportOptions
): void {
  // Clear black canvas
  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, width, height);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#0F131A");
  grad.addColorStop(1, "#07090D");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Camera Motion simulation
  ctx.save();
  const movement = (panel?.cameraMovement || "").toLowerCase();
  if (movement.includes("dolly") || movement.includes("zoom") || movement.includes("in")) {
    const scale = 1.0 + progress * 0.08;
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);
  } else if (movement.includes("pan") || movement.includes("track")) {
    const translateX = (progress - 0.5) * (width * 0.04);
    ctx.translate(translateX, 0);
  }

  // Draw Central Cinematic Schematic Illustration
  const centerX = width / 2;
  const centerY = height / 2;

  // Grid background
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Subject Silhouette
  const shotType = (panel?.shotType || "CU").toUpperCase();
  ctx.fillStyle = panel?.status === "OUTDATED" ? "rgba(245, 158, 11, 0.25)" : "rgba(212, 155, 84, 0.25)";
  ctx.strokeStyle = panel?.status === "OUTDATED" ? "#F59E0B" : "#D49B54";
  ctx.lineWidth = 2;

  if (shotType === "CU" || shotType === "CLOSEUP") {
    // Head / shoulder portrait
    ctx.beginPath();
    ctx.arc(centerX, centerY - 40, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 130, 140, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (shotType === "WIDE" || shotType === "ESTABLISHING") {
    // Rooftop skyline silhouette
    ctx.fillRect(centerX - 300, centerY - 20, 120, 180);
    ctx.strokeRect(centerX - 300, centerY - 20, 120, 180);
    ctx.fillRect(centerX - 140, centerY - 80, 160, 240);
    ctx.strokeRect(centerX - 140, centerY - 80, 160, 240);
    ctx.fillRect(centerX + 60, centerY - 40, 200, 200);
    ctx.strokeRect(centerX + 60, centerY - 40, 200, 200);
  } else {
    // Medium two-shot
    ctx.beginPath();
    ctx.arc(centerX - 90, centerY - 30, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX + 90, centerY - 30, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Draw Optical Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    width * 0.75
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Technical HUD Overlay
  if (options.includeTechnicalHUD !== false) {
    ctx.fillStyle = "#A0A7B2";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`SCENE ${clip.sceneNumber} • ${clip.name}`, 40, 50);

    const totalSeconds = Math.floor(frameNumber / fps);
    const frames = frameNumber % fps;
    const sec = totalSeconds % 60;
    const min = Math.floor(totalSeconds / 60) % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    const tc = `01:${pad(min)}:${pad(sec)}:${pad(frames)}`;

    ctx.fillStyle = "#D49B54";
    ctx.font = "bold 18px monospace";
    ctx.fillText(tc, width - 200, 50);

    ctx.fillStyle = "#69717E";
    ctx.font = "14px monospace";
    ctx.fillText(`${clip.metadata.lens || "24mm Anamorphic"} • 24.00 FPS • T1.9`, 40, height - 40);

    if (clip.status === "OUTDATED") {
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 14px monospace";
      ctx.fillText("⚠️ SCRIPT REVISION PENDING", width - 290, height - 40);
    }
  }

  // Subtitles / Dialogue
  if (options.includeSubtitles !== false && panel?.dialogue) {
    const dialogue = panel.dialogue;
    const speaker = panel.charactersVisible?.[0]?.toUpperCase() || "";

    ctx.save();
    ctx.font = "italic 22px Georgia, serif";
    const textWidth = ctx.measureText(`"${dialogue}"`).width;
    const boxWidth = Math.min(width - 120, textWidth + 60);
    const boxX = (width - boxWidth) / 2;
    const boxY = height - 120;

    // Subtitle background pill
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(boxX, boxY, boxWidth, 54);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.strokeRect(boxX, boxY, boxWidth, 54);

    if (speaker) {
      ctx.fillStyle = "#D49B54";
      ctx.font = "bold 12px monospace";
      ctx.fillText(speaker, boxX + 20, boxY + 18);
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(`"${dialogue}"`, boxX + 20, boxY + 42);
    ctx.restore();
  }
}

# Editorial Timeline & NLE Interchange Architecture

**System**: Scribe Studio (Agentic Cinema Operating System)  
**Standard**: 24 FPS SMPTE Timecode & Directed AST Track Synchronization  
**Status**: Implemented & Production Ready  

---

## 1. Overview & Vision

In traditional Hollywood post-production, there is a fundamental breakdown between the screenwriter's draft, the storyboard artist's panels, and the editor's non-linear editing system (NLE like Avid Media Composer, Premiere Pro, DaVinci Resolve, or Final Cut Pro). When an editor recuts an animatic or a writer rewrites Scene 18, timing information is lost across manual spreadsheets and disconnected video renders.

**Scribe Studio bridges this gap with a native Editorial Timeline domain model.**

The animatic screening room and export engine are built on top of a frame-accurate, track-based `EditorialTimeline` data structure that maintains direct AST links back to:
- Screenplay Scene numbers and Line IDs
- Storyboard Panel IDs and camera angles
- Dialogue speaker blocks and character timing
- Propagation state (Shielded vs. Outdated / Dirty)

---

## 2. Core Domain Model (`packages/project-model/src/types.ts`)

The editorial interchange data model is structured around standard SMPTE timecode conventions:

```typescript
export type EditorialTrackType = "video" | "audio" | "dialogue" | "subtitles" | "effects";

export interface EditorialClip {
  id: string;
  trackId: string;
  name: string;
  sourceType: "storyboard-panel" | "audio-take" | "dialogue-cue" | "action-beat" | "title-card";
  sourceId: string;
  sceneNumber: number;
  inPointFrames: number;
  outPointFrames: number;
  durationFrames: number;
  timelineInFrames: number;
  timelineOutFrames: number;
  fps: number;
  timecodeIn: string;
  timecodeOut: string;
  metadata?: {
    cameraAngle?: string;
    lensSuggestion?: string;
    speaker?: string;
    dialogue?: string;
    action?: string;
    propagationStatus?: "APPROVED" | "OUTDATED" | "LOCKED" | "DRAFT";
  };
}

export interface EditorialTrack {
  id: string;
  name: string;
  type: EditorialTrackType;
  index: number;
  clips: EditorialClip[];
  muted: boolean;
  locked: boolean;
}

export interface EditorialTimeline {
  id: string;
  title: string;
  sceneNumber: number;
  timebaseFps: number; // Strictly 24 FPS by default
  startFrame: number;
  totalDurationFrames: number;
  totalDurationSeconds: number;
  timecodeStart: string; // SMPTE standard (e.g., "01:00:00:00")
  timecodeDuration: string;
  tracks: EditorialTrack[];
  generatedAt: string;
}
```

---

## 3. Mathematical Continuity & 24 FPS Timebase

Hollywood theatrical standard is **24.000 frames per second**. Scribe Studio calculates frame boundaries with integer precision:

$$\text{Frames} = \text{Math.round}(\text{durationSeconds} \times 24)$$

SMPTE timecode is formatted deterministically as `HH:MM:SS:FF`:
- `framesRemainder = totalFrames % 24`
- `totalSeconds = Math.floor(totalFrames / 24)`
- `seconds = totalSeconds % 60`
- `minutes = Math.floor(totalSeconds / 60) % 60`
- `hours = Math.floor(totalSeconds / 3600)`

Every clip on Track V1 (Visual Animatic Panels) and Track A1 (Dialogue Scratch & Timing) maintains strict contiguous alignment without fractional frame rounding errors.

---

## 4. Cross-System Interchange Roadmap

The `EditorialTimeline` data structure maps directly into industry-standard interchange formats:

| Format | Extension | Target Workflow | Status |
| :--- | :--- | :--- | :--- |
| **MP4 / WebM Animatic** | `.mp4`, `.webm` | Direct screening, director dailies, pitch decks | **Live (via Mediabunny & WebCodecs)** |
| **OpenTimelineIO (OTIO)** | `.otio` | Pixar/Academy open standard for track interchange across Resolve, Nuke Studio, Maya | **Schema-Ready / Phase 2 Export** |
| **CMX 3600 EDL** | `.edl` | Legacy editorial conform and color grading suites | **Schema-Ready** |
| **Final Cut Pro XML** | `.fcpxml` | Apple FCP, DaVinci Resolve, Adobe Premiere Pro | **Schema-Ready** |
| **glTF 2.0 / GLB** | `.glb`, `.gltf` | Unreal Engine 5, Blender 4, Maya 3D virtual production | **Live (via Three.js GLTFExporter)** |

---

## 5. Propagation State in the Timeline

A major innovation of Scribe Studio's editorial architecture is **invalidation inheritance**:
- When a writer edits dialogue or changes an action beat in Scene 18, Scribe's **Continuity Propagation Engine** marks affected storyboard panels as `OUTDATED`.
- The `buildEditorialTimelineForScene` compiler automatically flags the corresponding `EditorialClip` with `propagationStatus: "OUTDATED"`.
- When the animatic video is exported via **Mediabunny**, outdated clips display a clear golden amber notification bar in the bottom screening status, alerting editorial that the visual cut no longer matches the approved script revision.

This prevents the single most common and costly disaster on film sets: shooting out-of-date animatics.

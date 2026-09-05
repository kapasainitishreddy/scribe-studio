import type {
  SceneExtraction,
  SceneBeat,
  StoryboardPanel,
  StoryboardSequence,
  Scene3DObject,
  ShotSize,
  ComicBubbleType
} from "../../project-model/src/types";

export interface GenerateStoryboardOptions {
  aspectRatio?: "16:9" | "2.39:1" | "4:3" | "1:1";
  layout?: StoryboardSequence["layout"];
}

/**
 * Generates an SVG schematic representing the visual composition of a panel.
 * Shows camera cone, character silhouettes, props, blocking arrows, and speech bubbles.
 */
export function generatePanelSvgSchematic(panel: Partial<StoryboardPanel>): string {
  const shot = panel.shotType || "medium";
  const action = panel.action || "";
  const dialogue = panel.dialogue || "";
  const speaker = panel.dialogueSpeaker || "";
  const characters = panel.charactersVisible || ["MAYA LIN"];
  const props = panel.propsVisible || [];

  // Compose SVG with dark cinematic aesthetic
  const isWide = shot === "wide" || shot === "establishing";
  const isClose = shot === "close-up" || shot === "extreme-close-up";
  const isInsert = shot === "insert";

  let charLeftX = isWide ? 120 : isClose ? 180 : 150;
  let charLeftY = isWide ? 110 : isClose ? 80 : 95;
  let charScale = isWide ? 0.7 : isClose ? 1.5 : 1.0;

  return `<svg viewBox="0 0 400 225" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e121a" />
      <stop offset="100%" stop-color="#080a0f" />
    </linearGradient>
    <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.02" />
    </linearGradient>
  </defs>

  <!-- Viewport Background -->
  <rect width="400" height="225" fill="url(#bgGrad)" />

  <!-- Studio Stage Perspective Grid Lines -->
  <line x1="0" y1="180" x2="400" y2="180" stroke="#1f2738" stroke-width="1.5" />
  <line x1="0" y1="210" x2="400" y2="210" stroke="#151b27" stroke-width="1" />
  <line x1="200" y1="130" x2="50" y2="225" stroke="#172030" stroke-width="1" stroke-dasharray="4,4" />
  <line x1="200" y1="130" x2="350" y2="225" stroke="#172030" stroke-width="1" stroke-dasharray="4,4" />

  <!-- Camera View Frustum Cone (Visualizing Lens FOV) -->
  <polygon points="200,225 60,110 340,110" fill="url(#coneGrad)" />
  <line x1="200" y1="225" x2="60" y2="110" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3" stroke-opacity="0.5" />
  <line x1="200" y1="225" x2="340" y2="110" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3" stroke-opacity="0.5" />

  ${
    isInsert
      ? `<!-- Insert Prop Macro Silhouette -->
  <g transform="translate(160, 80)">
    <rect x="0" y="0" width="80" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <circle cx="40" cy="25" r="16" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5" />
    <line x1="20" y1="25" x2="60" y2="25" stroke="#38bdf8" stroke-width="2" />
    <text x="40" y="65" fill="#38bdf8" font-size="9" font-family="monospace" text-anchor="middle">ACTIVE ASSET</text>
  </g>`
      : `<!-- Character 1 Silhouette -->
  <g transform="translate(${charLeftX}, ${charLeftY}) scale(${charScale})">
    <ellipse cx="20" cy="15" rx="12" ry="14" fill="#3b82f6" opacity="0.85" />
    <path d="M 5,60 C 5,35 35,35 35,60 Z" fill="#2563eb" opacity="0.85" />
    <text x="20" y="-4" fill="#93c5fd" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">${characters[0]?.split(" ")[0] || "LEAD"}</text>
  </g>

  ${
    characters.length > 1
      ? `<!-- Character 2 Silhouette -->
  <g transform="translate(${charLeftX + (isClose ? 80 : 110)}, ${charLeftY + 5}) scale(${charScale * 0.95})">
    <ellipse cx="20" cy="15" rx="12" ry="14" fill="#10b981" opacity="0.85" />
    <path d="M 5,60 C 5,35 35,35 35,60 Z" fill="#059669" opacity="0.85" />
    <text x="20" y="-4" fill="#6ee7b7" font-size="8" font-family="sans-serif" font-weight="bold" text-anchor="middle">${characters[1]?.split(" ")[0] || "SUPPORT"}</text>
  </g>`
      : ""
  }`
  }

  <!-- Blocking Movement Direction Arrow -->
  <path d="M 170,175 Q 200,165 230,175" fill="none" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)" />

  <!-- Camera Metadata Indicator -->
  <g transform="translate(10, 15)">
    <rect x="0" y="0" width="110" height="20" rx="4" fill="#090d14" fill-opacity="0.8" stroke="#252f42" stroke-width="1" />
    <circle cx="10" cy="10" r="3" fill="#ef4444" />
    <text x="20" y="13" fill="#cbd5e1" font-size="9" font-family="monospace" font-weight="bold">${shot.toUpperCase()} • ${panel.cameraAngle?.toUpperCase() || "EYE-LEVEL"}</text>
  </g>

  <!-- Dialogue Speech Bubble Overlay -->
  ${
    dialogue
      ? `<g transform="translate(40, 20)">
    <rect x="0" y="0" width="320" height="34" rx="6" fill="#141924" fill-opacity="0.9" stroke="#334155" stroke-width="1" />
    <polygon points="160,34 168,42 176,34" fill="#141924" stroke="#334155" stroke-width="1" />
    <text x="10" y="14" fill="#facc15" font-size="8.5" font-family="sans-serif" font-weight="bold">${speaker || "SPEAKER"}:</text>
    <text x="10" y="27" fill="#f1f5f9" font-size="8" font-family="sans-serif">"${dialogue.slice(0, 52)}${dialogue.length > 52 ? "..." : ""}"</text>
  </g>`
      : ""
  }

  <!-- Action Caption Box -->
  ${
    action && !dialogue
      ? `<g transform="translate(20, 190)">
    <rect x="0" y="0" width="360" height="24" rx="4" fill="#090d14" fill-opacity="0.85" stroke="#252f42" stroke-width="1" />
    <text x="10" y="16" fill="#94a3b8" font-size="8" font-family="sans-serif" font-style="italic">${action.slice(0, 68)}${action.length > 68 ? "..." : ""}</text>
  </g>`
      : ""
  }
</svg>`;
}

/**
 * Transforms a SceneExtraction into an initial sequence of StoryboardPanel objects.
 * Automatically aligns shot framing, camera angle, lighting, and composition to dramatic beats.
 */
export function generateStoryboardSequence(
  extraction: SceneExtraction,
  scene3DObjectsOrOptions?: Scene3DObject[] | GenerateStoryboardOptions,
  optionsOrNothing?: GenerateStoryboardOptions
): StoryboardSequence {
  const scene3DObjects = Array.isArray(scene3DObjectsOrOptions) ? scene3DObjectsOrOptions : [];
  const options =
    !Array.isArray(scene3DObjectsOrOptions) && scene3DObjectsOrOptions
      ? scene3DObjectsOrOptions
      : optionsOrNothing || {};

  const beats = extraction.storyBeats;
  const sequenceId = `seq-scene-${extraction.sceneNumber}-${Date.now()}`;
  const panels: StoryboardPanel[] = [];

  const shotStrategy: ShotSize[] = [
    "establishing",
    "medium",
    "two-shot",
    "insert",
    "close-up",
    "over-shoulder"
  ];

  const angleStrategy: StoryboardPanel["cameraAngle"][] = [
    "eye-level",
    "low-angle",
    "eye-level",
    "high-angle",
    "low-angle",
    "eye-level"
  ];

  beats.forEach((beat, index) => {
    const shotType = shotStrategy[index % shotStrategy.length];
    const cameraAngle = angleStrategy[index % angleStrategy.length];
    const panelNumber = index + 1;
    const panelId = `panel-${extraction.sceneNumber}-${panelNumber}`;

    // Correlate dialogue
    const dialogue = beat.dialogue;
    const speaker = beat.speaker;
    const bubbleType: ComicBubbleType = dialogue?.toLowerCase().includes("into radio")
      ? "off-screen"
      : dialogue
      ? "speech"
      : "caption";

    const lighting =
      extraction.timeOfDay.includes("NIGHT")
        ? "Low-key high contrast, cold cyan fill with warm amber rim key"
        : "Overcast diffusion with high-contrast horizon highlights";

    const panel: StoryboardPanel = {
      id: panelId,
      sequenceId,
      sceneNumber: extraction.sceneNumber,
      beatId: beat.id,
      panelNumber,
      shotType,
      cameraAngle,
      lensSuggestion: shotType === "establishing" ? "24mm Anamorphic" : shotType === "insert" ? "85mm Macro" : "50mm Prime",
      cameraMovement: index === 0 ? "Slow push-in track" : index === 3 ? "Static locked-off frame" : "Handheld subtle sway",
      composition:
        shotType === "two-shot"
          ? "Balanced two-shot across rule of thirds"
          : shotType === "insert"
          ? "Tight macro framing on central asset"
          : "Leading character on left third with exit space on right",
      charactersVisible: beat.characters.length > 0 ? beat.characters : extraction.charactersPresent,
      action: beat.action,
      dialogue,
      dialogueSpeaker: speaker,
      caption: !dialogue ? beat.description : undefined,
      bubbleType,
      location: extraction.location,
      propsVisible: beat.props.length > 0 ? beat.props : extraction.props.slice(0, 2),
      lightingIntent: lighting,
      mood: beat.emotion || "Tense and calculated",
      colorMood: extraction.sceneNumber === 1 ? "#3b82f6" : extraction.sceneNumber === 2 ? "#f59e0b" : "#10b981",
      continuityReferences: [
        `Scene ${extraction.sceneNumber} Wardrobe: Tactical Kevlar`,
        `Props required: ${extraction.props.join(", ") || "None"}`
      ],
      directorNotes: `Beat ${panelNumber}: Emphasize ${beat.emotion}. Maintain camera axis on 180-degree line.`,
      generationPrompt: `Cinematic movie storyboard frame of ${extraction.slugline}, ${shotType} shot, ${cameraAngle}, ${beat.action}. ${lighting}. High fidelity concept art.`,
      version: 1,
      status: "APPROVED",
      sourceLineIds: beat.sourceLineIds
    };

    // Attach deterministic SVG schematic
    panel.svgSchematic = generatePanelSvgSchematic(panel);
    panels.push(panel);
  });

  return {
    id: sequenceId,
    sceneNumber: extraction.sceneNumber,
    title: `${extraction.slugline} — Visual Script Sequence`,
    layout: options.layout || "6-panel",
    panels,
    aspectRatio: options.aspectRatio || "16:9",
    updatedAt: new Date().toISOString()
  };
}

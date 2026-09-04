import type { AgentMessage } from "./types";

export function runOfflineHeuristic(messages: AgentMessage[], taskHint?: string): string {
  const userMsg = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n");
  const lower = userMsg.toLowerCase();

  // Writer Agent tasks
  if (taskHint === "writer-rewrite" || lower.includes("rewrite scene") || lower.includes("increase tension") || lower.includes("shorten")) {
    if (lower.includes("shorten") || lower.includes("tighten")) {
      return `[WRITER AGENT PROPOSAL - PACING PASS]
Tightened dialogue exchanges by cutting conversational preamble. Heightened urgency under active countdown constraints.

SUGGESTED REVISION:
- Trimmed exposition lines from terminal hacking sequence.
- Sharp, staccato line deliveries to reflect imminent perimeter breach.`;
    }
    return `[WRITER AGENT PROPOSAL - TENSION PASS]
Heightened subtext and dramatic stakes between the characters. Enhanced tactical sensory details in action beats.

SUGGESTED ENHANCEMENT:
- Emphasized the ticking clock of automated security sweeps.
- Introduced subtextual friction regarding missing personal motivations.`;
  }

  // Character Agent tasks
  if (taskHint === "character-qa" || lower.includes("would maya") || lower.includes("what does") || lower.includes("character")) {
    if (lower.includes("maya") && lower.includes("know")) {
      return `Based on verified Story Bible Canon:
At Scene 1, Maya Lin knows the cipher matrix operates on a 16ms dynamic rebuild cycle and that the halon system triggers on error.
She has NOT revealed to Marcus that Elena designed the prototype quantum key. She only confirms Elena's authorship at the docks in Scene 4.`;
    }
    if (lower.includes("marcus")) {
      return `Based on Marcus Kane's Character Dossier:
Marcus is a cynical, battle-weary tactical pragmatist. His primary goal is survival and escrow collection. He will not initiate needless firefights if an exfiltration route remains viable.`;
    }
    if (lower.includes("thorne")) {
      return `Based on Dr. Aris Thorne's Canon Profile:
Thorne acts through calculated corporate authority. He knows the Obsidian Drive payload contains proprietary military secrets and is willing to purge Vault 7 entirely to prevent unauthorized decryption.`;
    }
    return `Character Agent Assessment:
The proposed action aligns with established psychological traits and dramatic objectives in the Story Bible. No violation of established canon or character knowledge boundaries detected.`;
  }

  // Director Agent tasks
  if (taskHint === "director-shots" || lower.includes("shot list") || lower.includes("coverage") || lower.includes("camera")) {
    return JSON.stringify(
      [
        {
          shotNumber: 1,
          size: "wide",
          lens: "27mm",
          angle: "Low Angle Slow Push",
          movement: "Dolly in on track",
          description: "Wide establishing of the environment, capturing environmental scale and atmosphere.",
          visualIntent: "Convey oppressive scale and immediate threat.",
          blockingNotes: "Lead actor positioned center frame, secondary guarding flank."
        },
        {
          shotNumber: 2,
          size: "medium",
          lens: "40mm",
          angle: "Over Shoulder",
          movement: "Handheld subtle sway",
          description: "Over-the-shoulder framing on primary interaction, tracking tense glances.",
          visualIntent: "Emphasize emotional tension between the two characters.",
          blockingNotes: "Actors maintain tight proxemics to emphasize whisper volume."
        },
        {
          shotNumber: 3,
          size: "close-up",
          lens: "65mm",
          angle: "Eye Level",
          movement: "Static lock-off",
          description: "Intense close-up on lead actor's facial expression as the critical event unfolds.",
          visualIntent: "Highlight internal realization and emotional stakes.",
          blockingNotes: "Light flickers across actor's eyes."
        }
      ],
      null,
      2
    );
  }

  // Scribe Meeting Agent tasks
  if (taskHint === "scribe-notes" || lower.includes("meeting") || lower.includes("table read") || lower.includes("transcript")) {
    return JSON.stringify(
      [
        {
          type: "decision",
          title: "Pacing adjustment in opening sequence",
          content: "Keep dialogue punchy during the vault breach; avoid pausing action for technical explanations.",
          status: "accepted"
        },
        {
          type: "continuity",
          title: "Prop handoff verification",
          content: "Ensure the titanium drive stays visible in the waterproof pouch throughout the docks escape.",
          status: "proposed"
        },
        {
          type: "suggestion",
          title: "Atmospheric sound design",
          content: "Layer low-frequency halon warning pulse underneath Marcus's carbine reload beat.",
          status: "proposed"
        }
      ],
      null,
      2
    );
  }

  // Default fallback response
  return `Agent Analysis:
1. Screenplay structure and formatting verified against standard Courier 12pt industry layout.
2. Continuity checks show no fatal contradictions with existing story bible canon.
3. Production requirements remain within manageable single-unit operational budget.`;
}

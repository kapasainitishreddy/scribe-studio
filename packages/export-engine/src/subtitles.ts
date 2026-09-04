import { parseScreenplay } from "../../screenplay-core/src/fountain";

export interface SubtitleCue {
  index: number;
  startMs: number;
  endMs: number;
  speaker: string | null;
  text: string;
}

export function buildSubtitleCues(document: string, options: { wordsPerMinute?: number; gapMs?: number } = {}): SubtitleCue[] {
  const wpm = options.wordsPerMinute ?? 160;
  const gap = options.gapMs ?? 120;
  const parsed = parseScreenplay(document);
  const cues: SubtitleCue[] = [];
  let clock = 0;

  for (const line of parsed.lines) {
    if (line.kind !== "dialogue" || !line.text.trim()) continue;
    const text = line.text.trim();
    const words = text.split(/\s+/).length;
    const duration = Math.max(1000, Math.round((words / wpm) * 60000));
    cues.push({
      index: cues.length + 1,
      startMs: clock,
      endMs: clock + duration,
      speaker: line.speaker?.trim() ?? null,
      text
    });
    clock += duration + gap;
  }

  return cues;
}

function formatTime(ms: number, sep: "," | "."): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  const pad = (n: number, s = 2) => String(n).padStart(s, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${sep}${pad(millis, 3)}`;
}

export function exportSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (c) =>
        `${c.index}\n${formatTime(c.startMs, ",")} --> ${formatTime(c.endMs, ",")}\n${c.speaker ? `${c.speaker.toUpperCase()}: ` : ""}${c.text}`
    )
    .join("\n\n")
    .concat("\n");
}

export function exportVtt(cues: SubtitleCue[]): string {
  return `WEBVTT\n\n${cues
    .map(
      (c) =>
        `${c.index}\n${formatTime(c.startMs, ".")} --> ${formatTime(c.endMs, ".")}\n${c.speaker ? `<v ${c.speaker}>` : ""}${c.text}`
    )
    .join("\n\n")}\n`;
}

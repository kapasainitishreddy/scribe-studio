import { parseScreenplay } from "../../screenplay-core/src/fountain";
import { parseTitlePage } from "../../screenplay-core/src/screenplayFormat";
import type { ScreenplayLineKind } from "../../screenplay-core/src/types";

export interface ImportReport {
  preserved: string[];
  transformed: string[];
  unsupported: string[];
}

export interface ImportResult {
  document: string;
  report: ImportReport;
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const unescapeXml = (value: string) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const FDX_TYPE_BY_KIND: Partial<Record<ScreenplayLineKind, string>> = {
  "scene-heading": "Scene Heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  shot: "Shot"
};

const KIND_BY_FDX_TYPE: Record<string, ScreenplayLineKind> = {
  "Scene Heading": "scene-heading",
  Action: "action",
  Character: "character",
  Parenthetical: "parenthetical",
  Dialogue: "dialogue",
  Transition: "transition",
  Shot: "shot",
  General: "action"
};

export function exportFdx(document: string): string {
  const title = parseTitlePage(document);
  const parsed = parseScreenplay(document.slice(title.bodyStart));

  const paragraphs = parsed.lines
    .filter((line) => line.text.trim() && FDX_TYPE_BY_KIND[line.kind])
    .map((line) => {
      const type = FDX_TYPE_BY_KIND[line.kind]!;
      const text = line.kind === "character" ? line.text.trim().replace(/\s*\^$/, "") : line.text.trim();
      const dual = line.kind === "character" && line.text.trim().endsWith("^") ? ' DualDialogue="Yes"' : "";
      return `    <Paragraph Type="${type}"${dual}>\n      <Text>${escapeXml(text)}</Text>\n    </Paragraph>`;
    })
    .join("\n");

  const titleEntries = Object.entries(title.fields)
    .map(
      ([key, value]) =>
        `    <Paragraph Type="General"><Text>${escapeXml(`${key[0].toUpperCase()}${key.slice(1)}: ${value.replace(/\n/g, " ")}`)}</Text></Paragraph>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs}
  </Content>${titleEntries ? `\n  <TitlePage>\n    <Content>\n${titleEntries}\n    </Content>\n  </TitlePage>` : ""}
</FinalDraft>`;
}

export function importFdx(xmlText: string): ImportResult {
  const paragraphs = [...xmlText.matchAll(/<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/g)];
  if (!paragraphs.length) {
    throw new Error("Invalid Final Draft file: No <Paragraph> tags detected.");
  }

  const titleSection = xmlText.match(/<TitlePage>([\s\S]*?)<\/TitlePage>/)?.[1] ?? "";
  const titleLines = [...titleSection.matchAll(/<Text>([\s\S]*?)<\/Text>/g)]
    .map((m) => unescapeXml(m[1]).trim())
    .filter((l) => /^[A-Za-z ]+:/.test(l));

  const bodyParagraphs = paragraphs.filter((m) => !titleSection.includes(m[0]));
  const counts = new Map<string, number>();
  const unsupportedTypes = new Set<string>();
  const lines: string[] = [];

  for (const match of bodyParagraphs) {
    const type = match[1].match(/Type="([^"]+)"/)?.[1] ?? "Action";
    const dual = /DualDialogue="Yes"/.test(match[1]);
    const content = [...match[2].matchAll(/<Text[^>]*>([\s\S]*?)<\/Text>/g)]
      .map((p) => unescapeXml(p[1]))
      .join("")
      .trim();

    if (!content) continue;
    const kind = KIND_BY_FDX_TYPE[type];
    if (!kind) {
      unsupportedTypes.add(type);
      continue;
    }
    counts.set(type, (counts.get(type) ?? 0) + 1);

    if (kind === "scene-heading" && lines.length) lines.push("");
    if (kind === "character") lines.push("", `${content.toUpperCase()}${dual ? " ^" : ""}`);
    else if (kind === "action" || kind === "transition" || kind === "shot") lines.push("", content);
    else lines.push(content);
  }

  const header = titleLines.length ? `${titleLines.join("\n")}\n\n` : "";
  const document = `${header}${lines.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n")}\n`;

  return {
    document,
    report: {
      preserved: [
        ...[...counts].map(([type, count]) => `${count} ${type} paragraphs`),
        ...(titleLines.length ? [`Title Page (${titleLines.length} fields)`] : [])
      ],
      transformed: ["Final Draft paragraphs mapped to Fountain elements"],
      unsupported: [...unsupportedTypes].map((t) => `${t} paragraphs skipped`)
    }
  };
}

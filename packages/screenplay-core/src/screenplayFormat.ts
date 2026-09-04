import { parseScreenplay } from "./fountain";
import type { ScreenplayLineKind } from "./types";

export const PAGE = {
  widthInches: 8.5,
  heightInches: 11,
  leftMarginInches: 1.5,
  rightMarginInches: 1,
  topMarginInches: 1,
  bottomMarginInches: 1,
  charactersPerInch: 10,
  linesPerInch: 6
} as const;

export const TEXT_COLUMNS = Math.round(
  (PAGE.widthInches - PAGE.leftMarginInches - PAGE.rightMarginInches) * PAGE.charactersPerInch
); // 60 columns
export const LINES_PER_PAGE = Math.floor(
  (PAGE.heightInches - PAGE.topMarginInches - PAGE.bottomMarginInches) * PAGE.linesPerInch
); // 54 lines

export interface ElementMetric {
  indent: number;
  width: number;
  align: "left" | "right" | "center";
  uppercase: boolean;
  spaceBefore: number;
}

export const ELEMENT_METRICS: Record<string, ElementMetric> = {
  "scene-heading": { indent: 0, width: 60, align: "left", uppercase: true, spaceBefore: 2 },
  action: { indent: 0, width: 60, align: "left", uppercase: false, spaceBefore: 1 },
  character: { indent: 22, width: 38, align: "left", uppercase: true, spaceBefore: 1 },
  parenthetical: { indent: 16, width: 28, align: "left", uppercase: false, spaceBefore: 0 },
  dialogue: { indent: 10, width: 35, align: "left", uppercase: false, spaceBefore: 0 },
  transition: { indent: 0, width: 60, align: "right", uppercase: true, spaceBefore: 1 },
  shot: { indent: 0, width: 60, align: "left", uppercase: true, spaceBefore: 1 },
  centered: { indent: 0, width: 60, align: "center", uppercase: false, spaceBefore: 1 },
  section: { indent: 0, width: 60, align: "left", uppercase: true, spaceBefore: 1 },
  synopsis: { indent: 0, width: 60, align: "left", uppercase: false, spaceBefore: 1 }
};

export interface TitlePage {
  fields: Record<string, string>;
  bodyStart: number;
}

const TITLE_KEY = /^(title|credit|author|authors|source|draft date|date|contact|copyright|notes|revision)\s*:\s*(.*)$/i;

export function parseTitlePage(document: string): TitlePage {
  const lines = document.split(/\r?\n/);
  if (!lines.length || !TITLE_KEY.test(lines[0].trim())) {
    return { fields: {}, bodyStart: 0 };
  }
  const fields: Record<string, string> = {};
  let index = 0;
  let lastKey = "";
  let offset = 0;
  for (; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim()) {
      offset += raw.length + 1;
      index += 1;
      break;
    }
    const match = raw.trim().match(TITLE_KEY);
    if (match) {
      lastKey = match[1].toLowerCase();
      fields[lastKey] = match[2].trim();
    } else if (lastKey && /^\s+/.test(raw)) {
      fields[lastKey] = `${fields[lastKey]}\n${raw.trim()}`.trim();
    } else {
      break;
    }
    offset += raw.length + 1;
  }
  return { fields, bodyStart: Math.min(offset, document.length) };
}

function center(text: string, width: number): string {
  const trimmed = text.trim();
  const padding = Math.max(0, Math.floor((width - trimmed.length) / 2));
  return `${" ".repeat(padding)}${trimmed}`;
}

export function formatTitlePageLines(title: TitlePage): string[] {
  const { fields } = title;
  if (!Object.keys(fields).length) return [];
  const centeredParts = (v: string) => v.split("\n").map((p) => p.trim());
  const lines: string[] = [];
  const titleBlock = [
    ...centeredParts(fields.title ?? ""),
    ...(fields.credit ? centeredParts(fields.credit) : []),
    ...(fields.author ?? fields.authors ? centeredParts(fields.author ?? fields.authors) : [])
  ].filter(Boolean);

  const topPadding = Math.max(0, Math.floor(LINES_PER_PAGE / 2) - Math.ceil(titleBlock.length / 2) - 4);
  for (let i = 0; i < topPadding; i += 1) lines.push("");
  for (const entry of titleBlock) lines.push(center(entry, TEXT_COLUMNS));

  const footer = [fields.source, fields["draft date"] ?? fields.date, fields.contact, fields.copyright].filter(
    Boolean
  ) as string[];
  while (lines.length < LINES_PER_PAGE - footer.length - 2) lines.push("");
  for (const entry of footer) {
    for (const part of centeredParts(entry)) lines.push(part);
  }
  return lines.slice(0, LINES_PER_PAGE);
}

export function wrapText(text: string, width: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [""];
  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export interface LaidOutLine {
  text: string;
  kind: ScreenplayLineKind | "centered" | "more" | "contd";
  sourceLineId: string | null;
}

export interface FormattedPage {
  number: number;
  lines: LaidOutLine[];
}

export interface PaginationOptions {
  includeTitlePage?: boolean;
  linesPerPage?: number;
}

interface Block {
  kind: keyof typeof ELEMENT_METRICS;
  lines: LaidOutLine[];
  spaceBefore: number;
  keepWithNext: boolean;
  speaker: string | null;
}

function renderBlockLines(
  kind: keyof typeof ELEMENT_METRICS,
  text: string,
  sourceLineId: string | null
): LaidOutLine[] {
  const metric = ELEMENT_METRICS[kind] || ELEMENT_METRICS.action;
  const value = metric.uppercase ? text.toUpperCase() : text;
  return wrapText(value, metric.width).map((line) => {
    const padded =
      metric.align === "right"
        ? line.padStart(TEXT_COLUMNS)
        : metric.align === "center"
          ? center(line, TEXT_COLUMNS)
          : `${" ".repeat(metric.indent)}${line}`;
    return { text: padded.trimEnd(), kind: kind as LaidOutLine["kind"], sourceLineId };
  });
}

function buildBlocks(document: string, bodyStart: number): Block[] {
  const body = document.slice(bodyStart);
  const parsed = parseScreenplay(body);
  const blocks: Block[] = [];
  let pendingSpeaker: string | null = null;

  for (const line of parsed.lines) {
    const value = line.text.trim();
    if (!value) {
      pendingSpeaker = null;
      continue;
    }
    let kind: keyof typeof ELEMENT_METRICS =
      line.kind === "blank" ? "action" : (line.kind as keyof typeof ELEMENT_METRICS);
    let text = value;

    if (/^>.*<$/.test(value)) {
      kind = "centered";
      text = value.slice(1, -1).trim();
    } else if (kind === "character") {
      text = value.replace(/^@/, "");
      pendingSpeaker = text.replace(/\s*\^$/, "").replace(/\s*\(.*\)$/, "").trim();
    }

    if (!ELEMENT_METRICS[kind]) kind = "action";
    blocks.push({
      kind,
      lines: renderBlockLines(kind, text, line.id),
      spaceBefore: ELEMENT_METRICS[kind].spaceBefore,
      keepWithNext: kind === "character" || kind === "parenthetical",
      speaker: kind === "character" || kind === "dialogue" || kind === "parenthetical" ? pendingSpeaker : null
    });
  }
  return blocks;
}

export function paginateScreenplay(document: string, options: PaginationOptions = {}): FormattedPage[] {
  const linesPerPage = options.linesPerPage ?? LINES_PER_PAGE;
  const title = parseTitlePage(document);
  const blocks = buildBlocks(document, title.bodyStart);
  const pages: FormattedPage[] = [];
  let current: LaidOutLine[] = [];

  const pushPage = () => {
    while (current.length && current[current.length - 1].text === "") current.pop();
    if (current.length) pages.push({ number: pages.length + 1, lines: current });
    current = [];
  };

  const remaining = () => linesPerPage - current.length;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const gap = current.length === 0 ? 0 : block.spaceBefore;
    const next = blocks[index + 1];
    const attachment = block.keepWithNext && next ? Math.min(2, next.lines.length) : 0;
    const needed = gap + block.lines.length + attachment;

    if (needed > remaining() && current.length > 0) {
      if (block.kind === "dialogue" && block.lines.length + gap > linesPerPage) {
        const take = Math.max(1, remaining() - gap - 1);
        for (let space = 0; space < gap; space += 1) {
          current.push({ text: "", kind: "action", sourceLineId: null });
        }
        current.push(...block.lines.slice(0, take));
        current.push({
          text: `${" ".repeat(ELEMENT_METRICS.character.indent)}(MORE)`,
          kind: "more",
          sourceLineId: null
        });
        pushPage();
        if (block.speaker) {
          current.push({
            text: `${" ".repeat(ELEMENT_METRICS.character.indent)}${block.speaker.toUpperCase()} (CONT'D)`,
            kind: "contd",
            sourceLineId: null
          });
        }
        current.push(...block.lines.slice(take));
        continue;
      }
      pushPage();
      if (block.kind === "dialogue" && block.speaker) {
        current.push({
          text: `${" ".repeat(ELEMENT_METRICS.character.indent)}${block.speaker.toUpperCase()} (CONT'D)`,
          kind: "contd",
          sourceLineId: null
        });
      }
      current.push(...block.lines);
      continue;
    }

    for (let space = 0; space < gap; space += 1) {
      current.push({ text: "", kind: "action", sourceLineId: null });
    }
    current.push(...block.lines);
  }
  pushPage();

  if (options.includeTitlePage) {
    const titleLines = formatTitlePageLines(title);
    if (titleLines.length) {
      return [
        {
          number: 0,
          lines: titleLines.map((t) => ({ text: t, kind: "centered" as const, sourceLineId: null }))
        },
        ...pages
      ];
    }
  }
  return pages;
}

export function pageCount(document: string, options: PaginationOptions = {}): number {
  return paginateScreenplay(document, options).filter((p) => p.number > 0).length;
}

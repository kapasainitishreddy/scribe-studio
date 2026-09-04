import { describe, it, expect } from "vitest";
import { SAMPLE_SCREENPLAY_TEXT } from "../packages/project-model/src/sampleProject";
import { exportFdx, importFdx } from "../packages/export-engine/src/interchangeFdx";
import { buildScreenplayPdf } from "../packages/export-engine/src/exportPdf";
import { generateCharacterSidesText } from "../packages/export-engine/src/exportSides";
import { buildSubtitleCues, exportSrt, exportVtt } from "../packages/export-engine/src/subtitles";

describe("Interchange and Export Engine", () => {
  it("should export and import Final Draft XML format", () => {
    const fdxXml = exportFdx(SAMPLE_SCREENPLAY_TEXT);
    expect(fdxXml).toContain("<FinalDraft");
    expect(fdxXml).toContain('Type="Scene Heading"');
    expect(fdxXml).toContain('Type="Character"');
    expect(fdxXml).toContain('Type="Dialogue"');

    const imported = importFdx(fdxXml);
    expect(imported.document).toContain("INT. CYBER VAULT 7 - NIGHT");
    expect(imported.document).toContain("MAYA");
    expect(imported.report.preserved.length).toBeGreaterThan(0);
  });

  it("should generate industry-standard vector Screenplay PDF bytes", () => {
    const pdfBytes = buildScreenplayPdf(SAMPLE_SCREENPLAY_TEXT, { pageNumbers: true });
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    // Verify PDF header '%PDF-1.4'
    const header = String.fromCharCode(...pdfBytes.slice(0, 8));
    expect(header).toContain("%PDF-1.4");
  });

  it("should generate character sides with preceding cue lines", () => {
    const sides = generateCharacterSidesText(SAMPLE_SCREENPLAY_TEXT, {
      characterName: "MAYA",
      projectTitle: "The Obsidian Protocol",
      includePrecedingCues: true
    });
    expect(sides).toContain("MAYA");
    expect(sides).toContain("(CUE - MARCUS)");
    expect(sides).toContain("The firewall isn't the problem, Marcus.");
  });

  it("should build accurate subtitle cues and format SRT / VTT", () => {
    const cues = buildSubtitleCues(SAMPLE_SCREENPLAY_TEXT);
    expect(cues.length).toBeGreaterThan(0);
    expect(cues[0].text).toBeDefined();

    const srt = exportSrt(cues);
    expect(srt).toContain("-->");

    const vtt = exportVtt(cues);
    expect(vtt).toContain("WEBVTT");
  });
});

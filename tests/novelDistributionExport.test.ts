import { describe, it, expect } from "vitest";
import { parseScreenplay, screenplayStats } from "../packages/screenplay-core/src/fountain";
import { buildDepartmentPackets } from "../packages/export-engine/src/distributionHub";
import { buildScreenplayPdf } from "../packages/export-engine/src/exportPdf";
import { exportFdx } from "../packages/export-engine/src/interchangeFdx";
import { generateCharacterSidesText, generateCharacterSidesPdf } from "../packages/export-engine/src/exportSides";

// Rich, dramatic adapted novel excerpt with intense character dialogue, clear beats, props, and multi-department cues
const NOVEL_ADAPTATION_SCREENPLAY = `Title: THE CYPHER OF CARCASSONNE
Author: Scribe Studio Adaptation Lab
Draft: Production White Draft

EXT. CARCASSONNE CITADEL - NIGHT

Torrential rain lashes against medieval stone ramparts. Thunder rolls through the black Pyrenees.

ELENA VANCE (32), soaked trench coat clinging to her frame, clutches an oiled leather satchel to her chest. Her left wrist is tightly wrapped in a bloodied bandage.

She checks a glowing green tracker. A signal blinks red. Fast approaching.

ELENA
(into collar radio)
Khalil, the northern gate is compromised. Kaufman was already waiting inside the perimeter.

KHALIL (O.S.)
(over radio static)
Abort and burn the manuscript, Elena. If Kaufman gets the cipher, the protocol dies with us.

ELENA
I didn't crawl through three kilometers of drainage tunnels to set history on fire.

Elena vaults over the low stone parapet, descending into the dark stairwell.

INT. SUBTERRANEAN CATHEDRAL CRYPT - CONTINUOUS

Flickering tallow candles illuminate row after row of ancient limestone tombs. 

THE ARCHIVIST (70s), blind in both eyes, sits behind an iron-banded desk, running trembling fingers over vellum scrolls.

The heavy iron door creaks open. Elena slips inside, water pooling at her boots.

THE ARCHIVIST
You bring the storm inside the house of God, daughter.

ELENA
Only the rain, Father. And the truth.

From the shadows of the nave, a distinct metallic click echoes. A gold lighter sparks, illuminating the sharp, aristocratic silhouette of INSPECTOR KAUFMAN (48). He snaps the lighter shut.

INSPECTOR KAUFMAN
A poetic sentiment, Vance. Sadly, truth has an unforgiving shelf life in international espionage.

ELENA
(steadying her breathing)
You're outside your jurisdiction by two hundred miles, Inspector.

INSPECTOR KAUFMAN
Jurisdiction is an administrative convenience for peace time. We haven't been at peace since your team cracked the second cipher.

Kaufman steps forward into the candlelight, unbuttoning his immaculate wool coat. His sidearm remains holstered, but his right hand rests casually on the grip.

INSPECTOR KAUFMAN (CONT'D)
Place the satchel on the Archivist's altar. Walk out into the courtyard. No sirens, no incident reports. Just an unfortunate disappearance in the Pyrenees.

ELENA
The code isn't on paper, Kaufman. The parchment in this satchel is merely the keyhole. The key is in my head.

INSPECTOR KAUFMAN
Then your head is coming with me to Paris.

Elena grabs an antique brass candlestick, hurling it into the iron brazier. Embers burst into the air, plunging the crypt into screaming chaos.

INT. BELL TOWER - MOMENTS LATER

Wind screams through the arched stone openings overlooking the valley. Rain sweeps sideways across the massive bronze bell.

Elena bursts through the trapdoor, gasping for breath, clutching the satchel.

AGENT KHALIL (30s), tactical headset and black wet-weather jacket, reaches down and hauls her onto the wooden landing.

KHALIL
You're bleeding through the bandage. Where's Kaufman?

ELENA
Behind me. Two flights down. He doesn't want the manuscript destroyed. That's our only leverage.

KHALIL
Our extraction window is ninety seconds. The helicopter cannot hover in this squall without drawing French radar.

ELENA
Then we don't extract. We broadcast the frequency right now from the relay transmitter.

KHALIL
If you transmit unencrypted, every intelligence agency from Langley to Moscow will intercept it!

ELENA
Good. Let the whole world read what Kaufman spent twenty years trying to bury.

She drives the cryptographic flash key into the tactical transmitter. A pulsing progress bar begins to upload.

EXT. CITADEL RAMPARTS - DAWN

Mist hangs heavy over the medieval battlements. The storm has passed into a cold, slate-grey morning.

Inspector Kaufman stands alone by the parapet, holding the charred remnants of the leather satchel. He inspects a melted brass buckle.

He pulls out a satellite phone, dialing with gloved fingers.

INSPECTOR KAUFMAN
(calm, chilling)
It's Kaufman. Cancel the border barricades. She didn't flee into Spain. She uploaded the third vector to public frequencies five minutes ago.

A long silence on the line.

INSPECTOR KAUFMAN (CONT'D)
Yes, sir. I understand. May God have mercy on all of us.

Kaufman drops the phone onto the wet stones and watches the sunrise bleed crimson over the mountains.

FADE OUT.`;

describe("Novel Adaptation & Automated Department Distribution Test Suite", () => {
  it("accurately parses adapted novel scenes, dialogue cues, and character roles", () => {
    const parsed = parseScreenplay(NOVEL_ADAPTATION_SCREENPLAY);
    const stats = screenplayStats(NOVEL_ADAPTATION_SCREENPLAY);

    expect(parsed.scenes.length).toBe(4);
    expect(parsed.scenes[0].heading).toContain("EXT. CARCASSONNE CITADEL - NIGHT");
    expect(parsed.scenes[1].heading).toContain("INT. SUBTERRANEAN CATHEDRAL CRYPT - CONTINUOUS");
    expect(parsed.scenes[2].heading).toContain("INT. BELL TOWER - MOMENTS LATER");
    expect(parsed.scenes[3].heading).toContain("EXT. CITADEL RAMPARTS - DAWN");

    // Check character dialogue cues
    expect(stats.characterCounts["ELENA"]).toBeGreaterThanOrEqual(5);
    expect(stats.characterCounts["INSPECTOR KAUFMAN"]).toBeGreaterThanOrEqual(3);
    expect(stats.characterCounts["KHALIL"]).toBeGreaterThanOrEqual(2);
    expect(stats.characterCounts["THE ARCHIVIST"]).toBeGreaterThanOrEqual(1);

    expect(stats.dialogueBlocks).toBeGreaterThan(10);
  });

  it("automatically sorts and packages recipient-specific packets for every department", () => {
    const packets = buildDepartmentPackets({
      projectTitle: "The Cypher of Carcassonne",
      screenplayText: NOVEL_ADAPTATION_SCREENPLAY,
      characters: {
        "elena": { name: "Elena", role: "Protagonist / Cryptographer" },
        "kaufman": { name: "Inspector Kaufman", role: "Antagonist / Chief Inspector" },
        "khalil": { name: "Khalil", role: "Tactical Specialist" },
        "archivist": { name: "The Archivist", role: "Vault Custodian" }
      }
    });

    // Verify summary metadata
    expect(packets.projectTitle).toBe("The Cypher of Carcassonne");
    expect(packets.summary.totalScenes).toBe(4);
    expect(packets.summary.totalCast).toBeGreaterThanOrEqual(4);
    expect(packets.summary.totalShots).toBe(16); // 4 shots per scene * 4 scenes
    expect(packets.summary.totalBreakdownElements).toBeGreaterThan(10);

    // 1. Cast Sides Distribution: Verify each actor gets only their relevant scenes
    const elenaPacket = packets.castPackets.find((p) => p.characterName === "ELENA");
    expect(elenaPacket).toBeDefined();
    expect(elenaPacket!.cueCount).toBeGreaterThanOrEqual(5);
    expect(elenaPacket!.sceneNumbers).toContain(1);
    expect(elenaPacket!.sceneNumbers).toContain(2);
    expect(elenaPacket!.sceneNumbers).toContain(3);
    expect(elenaPacket!.sceneNumbers).not.toContain(4); // Elena does not speak in Scene 4
    expect(elenaPacket!.sidesText).toContain("AUDITION / REHEARSAL SIDES");
    expect(elenaPacket!.sidesText).toContain("ELENA");
    expect(elenaPacket!.sidesText).toContain("(CUE - KHALIL");
    // Verify valid PDF generation
    const elenaPdfHeader = String.fromCharCode(...Array.from(elenaPacket!.sidesPdfBytes.slice(0, 5)));
    expect(elenaPdfHeader).toBe("%PDF-");

    const kaufmanPacket = packets.castPackets.find((p) => p.characterName === "INSPECTOR KAUFMAN");
    expect(kaufmanPacket).toBeDefined();
    expect(kaufmanPacket!.sceneNumbers).toContain(2);
    expect(kaufmanPacket!.sceneNumbers).toContain(4);
    expect(kaufmanPacket!.sceneNumbers).not.toContain(1); // Kaufman does not speak in Scene 1
    expect(kaufmanPacket!.sceneNumbers).not.toContain(3); // Kaufman does not speak in Scene 3

    const archivistPacket = packets.castPackets.find((p) => p.characterName === "THE ARCHIVIST");
    expect(archivistPacket).toBeDefined();
    expect(archivistPacket!.sceneNumbers).toEqual([2]); // Only in the crypt scene

    // 2. Director's Packet: Scene-by-scene beat sheet
    expect(packets.directorPacket.filename).toBe("The_Cypher_of_Carcassonne_DIRECTOR_BEATS.md");
    expect(packets.directorPacket.sceneBeats.length).toBe(4);
    expect(packets.directorPacket.contentMarkdown).toContain("DIRECTOR'S BEAT SHEET & COVERAGE");
    expect(packets.directorPacket.contentMarkdown).toContain("SCENE 1: EXT. CARCASSONNE CITADEL - NIGHT");
    expect(packets.directorPacket.contentMarkdown).toContain("SCENE 2: INT. SUBTERRANEAN CATHEDRAL CRYPT - CONTINUOUS");
    expect(packets.directorPacket.contentMarkdown).toContain("Dramatic Beat & Turning Point");

    // 3. Cinematographer's Packet: 2.39:1 Anamorphic shotlist
    expect(packets.cinematographerPacket.filename).toBe("The_Cypher_of_Carcassonne_CINEMATOGRAPHER_SHOTLIST.csv");
    expect(packets.cinematographerPacket.aspectRatio).toBe("2.39:1 Anamorphic Scope");
    expect(packets.cinematographerPacket.shotlistCsv).toContain("Scene,Shot Code,Type,Angle,Lens,Movement,Subject,Lighting Mood");
    expect(packets.cinematographerPacket.shotlistCsv).toContain("1,1-A,Wide Master,Low Angle,24mm Anamorphic Prime");
    expect(packets.cinematographerPacket.shotlistCsv).toContain("2,2-C,Close-Up (Turn),Eye Level,85mm Anamorphic Prime");

    // 4. Script Supervisor's Packet: Prop & wardrobe continuity tracking
    expect(packets.scriptSupervisorPacket.filename).toBe("The_Cypher_of_Carcassonne_CONTINUITY_LOG.txt");
    expect(packets.scriptSupervisorPacket.continuityLogText).toContain("CONTINUITY & SCRIPT SUPERVISOR AUDIT LOG");
    expect(packets.scriptSupervisorPacket.propsTracked).toContain("SATCHEL");
    expect(packets.scriptSupervisorPacket.propsTracked).toContain("CIPHER");
    expect(packets.scriptSupervisorPacket.wardrobeContinuity).toContain("COAT");
    expect(packets.scriptSupervisorPacket.continuityLogText).toContain("100% Verified");

    // 5. Producer's Packet: 16 Hollywood categories breakdown
    expect(packets.producerPacket.filename).toBe("The_Cypher_of_Carcassonne_PRODUCTION_BREAKDOWN.csv");
    expect(packets.producerPacket.breakdownCsv).toContain("Scene,Category,Element Name,Status,Locked");
    expect(packets.producerPacket.categories["cast"]).toBeGreaterThan(0);
    expect(packets.producerPacket.totalElements).toBeGreaterThan(5);

    // 6. Master Screenplay Formats: Ready for industry export
    const masterPdfHeader = String.fromCharCode(...Array.from(packets.masterScreenplay.pdfBytes.slice(0, 5)));
    expect(masterPdfHeader).toBe("%PDF-");
    expect(packets.masterScreenplay.fdxXml).toContain("<FinalDraft DocumentType=\"Script\"");
    expect(packets.masterScreenplay.fdxXml).toContain("<Paragraph Type=\"Scene Heading\">");
    expect(packets.masterScreenplay.fountainText).toBe(NOVEL_ADAPTATION_SCREENPLAY);
    expect(packets.masterScreenplay.srtSubtitles).toContain("00:00:00,000 -->");
    expect(packets.masterScreenplay.srtSubtitles).toContain("ELENA");
  });

  it("produces compliant standalone character sides text and PDF with preceding cues", () => {
    const sidesText = generateCharacterSidesText(NOVEL_ADAPTATION_SCREENPLAY, {
      characterName: "ELENA",
      projectTitle: "The Cypher of Carcassonne",
      includePrecedingCues: true
    });

    expect(sidesText).toContain("THE CYPHER OF CARCASSONNE - AUDITION / REHEARSAL SIDES");
    expect(sidesText).toContain("Character: ELENA");
    expect(sidesText).toContain('(CUE - KHALIL)');
    expect(sidesText).toContain('"Abort and burn the manuscript, Elena.');
    expect(sidesText).toContain("ELENA\nI didn't crawl through three kilometers");

    const pdfBytes = generateCharacterSidesPdf(NOVEL_ADAPTATION_SCREENPLAY, {
      characterName: "ELENA",
      projectTitle: "The Cypher of Carcassonne"
    });

    expect(pdfBytes.length).toBeGreaterThan(500);
    const header = String.fromCharCode(...Array.from(pdfBytes.slice(0, 5)));
    expect(header).toBe("%PDF-");
  });
});

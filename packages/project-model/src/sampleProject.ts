import type { Project, StoryThread } from "./types";
import { screenplayStats } from "../../screenplay-core/src/fountain";
import { extractScene } from "../../production-engine/src/sceneExtraction";
import { generateStoryboardSequence } from "../../production-engine/src/storyboardGenerator";

export const SAMPLE_SCREENPLAY_TEXT = `Title: THE OBSIDIAN PROTOCOL
Credit: Written by
Author: Kapasai Nitish Reddy
Draft date: October 2026
Contact: productions@scribestudio.io

INT. CYBER VAULT 7 - NIGHT

A subterranean sanctum of server monoliths, hum-droning in arctic chill. Condensation drips from overhead coolant conduits.

MAYA LIN (30s), sharp-eyed cryptographer in tactical Kevlar, kneels before the primary terminal. Her fingertips blur over the luminescent key interface.

MARCUS KANE (40s), weathered mercenary with a fresh shrapnel scar across his left cheek, scans the perimeter with a suppressed carbine.

MARCUS
Two minutes until their automated sweeps cycle back. Tell me you've bypassed the biocentric firewall.

MAYA
(without looking up)
The firewall isn't the problem, Marcus. The cipher matrix is dynamically rebuilding every sixteen milliseconds.

She pulls an ENCRYPTED TITANIUM DRIVE from her combat belt and clicks it into the console port.

MAYA (CONT'D)
Hold the door. If this feedback loop trips, the halon suppression system will suffocate us in under forty seconds.

MARCUS
Comforting as always.

Marcus raises his tactical tracker. Three blinking RED VECTORS illuminate the glass display.

MARCUS (CONT'D)
We've got company on the service lift. Heavy armor.

EXT. ROOFTOP HELIPAD - NIGHT

Driving rain lashes across the concrete expanse. Wind howls at forty knots.

DR. ARIS THORNE (50s), tailored trench coat soaked by the squall, steps out from the shadows of a rotor-spinning stealth transport. TWO ARMED MERCENARIES flank him.

DR. THORNE
(into satellite communicator)
Lock down all pneumatic bulkheads on sub-level four. No one leaves Vault 7 with the Obsidian Drive alive.

MERCENARY LEADER
Sir, Lin has initiated the core extraction sequence.

DR. THORNE
Then trigger the quarantine override. Even if she cracks the encryption, she has no idea what the payload actually contains.

Thorne smiles coldly as lightning fractures the stormy horizon.

INT. SUB-LEVEL LAB - CONTINUOUS

Sparks shower from severed overhead cables. An automated ALARM siren pulses amber throughout the corridor.

Maya yanks the glowing TITANIUM DRIVE from the terminal. A holographic prompt flashes: "DECRYPTION 100% COMPLETE".

MAYA
Drive secured! Move!

Marcus fires two precision bursts through the heavy reinforced doorway, shattering the electronic lock relays.

MARCUS
Rooftop extraction is compromised. Thorne is already on the helipad with his perimeter team.

MAYA
There's an emergency drainage flume leading to the Tokyo harbor docks.

MARCUS
(reloading carbine)
Tell me you're joking. That flume drops eighty feet into freezing industrial runoff.

MAYA
Do you want to explain that to Thorne, or do you want to jump?

EXT. TOKYO INDUSTRIAL DOCKS - RAIN - DAWN

Steel shipping containers loom like monoliths in the grey morning fog. Cold tidal water laps against decaying wooden pilings.

Maya emerges from the storm drainage grating, soaked to the bone but clutching the TITANIUM DRIVE in a sealed waterproof pouch.

Marcus drags himself onto the concrete pier, wincing as he clutches his bruised ribs.

MARCUS
Next time you pick the exfiltration route, pick one with stairs.

Maya opens the drive casing. A pulsing BLUE DATA REEL reveals thousands of encrypted dossier files.

MAYA
Marcus... look at the timestamp on the master manifest.

MARCUS
What is it?

MAYA
Thorne didn't steal this prototype from the military. My sister designed it three years before she disappeared.

Marcus freezes. A heavy silence hangs between them, heavier than the cold Pacific rain.

FADE OUT.
`;

export function createSampleProject(): Project {
  const stats = screenplayStats(SAMPLE_SCREENPLAY_TEXT);
  const now = new Date().toISOString();

  return {
    id: "project-obsidian-protocol",
    title: "The Obsidian Protocol",
    author: "Kapasai Nitish Reddy",
    synopsis:
      "When a brilliant cryptographer and a rogue operative breach an impenetrable underground vault to steal a quantum cyber-weapon, they uncover evidence that the project's architect is the cryptographer's long-lost sister.",
    screenplayText: SAMPLE_SCREENPLAY_TEXT,
    version: 2,
    characters: {
      "maya-lin": {
        id: "maya-lin",
        name: "Maya Lin",
        normalizedName: "maya lin",
        role: "lead",
        biography:
          "Former cyber-warfare specialist turned rogue data liberator. Motivated by discovering the truth behind her sister Elena's mysterious disappearance.",
        traits: ["hyper-analytical", "cool under pressure", "distrustful", "unflinching"],
        speakingStyle: "Concise, precise, technical metaphors, rare emotional vulnerability.",
        vocabularyNotes: "Uses encryption and operational terminology naturally without hesitation.",
        dramaticObjective: "Retrieve the Obsidian quantum key and decrypt the master personnel manifest.",
        fears: ["Finding out her sister willingly engineered a weapon of mass surveillance"],
        secrets: ["She concealed the existence of Elena's encrypted signature from Marcus"],
        injuries: ["Minor rope abrasions on wrists from drainage descent"],
        wardrobeNotes: "Tactical Kevlar vest over dark storm-proof compression suit, waterproof utility belt.",
        knowledgeByScene: {
          1: ["The cipher matrix rebuilds every 16ms", "Vault halon system trips on feedback"],
          2: ["Thorne is on the helipad with armed security"],
          3: ["The drive decrypts to 100%", "Marcus is out of primary ammunition"],
          4: ["Elena Lin authored the prototype core manifest"]
        },
        relationships: [
          {
            targetCharacterId: "marcus-kane",
            targetCharacterName: "Marcus Kane",
            relationshipType: "Uneasy Combat Ally",
            notes: "Trusts his tactical skills, but suspects his former corporate employer."
          },
          {
            targetCharacterId: "dr-aris-thorne",
            targetCharacterName: "Dr. Aris Thorne",
            relationshipType: "Mortal Adversary",
            notes: "Thorne was Elena's supervisor before her disappearance."
          }
        ]
      },
      "marcus-kane": {
        id: "marcus-kane",
        name: "Marcus Kane",
        normalizedName: "marcus kane",
        role: "lead",
        biography:
          "Disillusioned corporate extraction mercenary. Survivalist instincts masking a deeply buried moral compass.",
        traits: ["cynical", "tactical pragmatist", "protective", "battle-weary"],
        speakingStyle: "Dry, dark sarcasm, military cadence, short declaratives.",
        vocabularyNotes: "Military callouts, weapon specs, logistical slang.",
        dramaticObjective: "Get Maya and the asset out of Japan in one piece to collect his severance escrow.",
        fears: ["Being betrayed by another corporate benefactor"],
        secrets: ["Was originally contracted by a rival syndicate to assassinate Thorne"],
        injuries: ["Shrapnel scar on left cheek", "Bruised lower ribs from flume landing"],
        wardrobeNotes: "Mud-splattered grey tactical windbreaker, carbon-fiber plate carrier, combat boots.",
        knowledgeByScene: {
          1: ["Two minutes on the sweep timer", "Service lift has heavy reinforcements"],
          2: ["Rooftop extraction is blocked"],
          3: ["Drainage route requires an 80-foot drop"],
          4: ["Maya has personal stakes in the drive manifest"]
        },
        relationships: [
          {
            targetCharacterId: "maya-lin",
            targetCharacterName: "Maya Lin",
            relationshipType: "Client / Reluctant Partner",
            notes: "Respects her unmatched intelligence; worries her emotions will get them killed."
          }
        ]
      },
      "dr-aris-thorne": {
        id: "dr-aris-thorne",
        name: "Dr. Aris Thorne",
        normalizedName: "dr aris thorne",
        role: "supporting",
        biography:
          "Director of Obsidian Special Projects. Ruthless technocrat who believes human conflict can be algorithmically suppressed.",
        traits: ["meticulous", "condescending", "megalomaniacal", "calm"],
        speakingStyle: "Formal, aristocratic cadence, measured pauses, quiet menace.",
        vocabularyNotes: "Corporate doublespeak combined with surgical military jargon.",
        dramaticObjective: "Recover the Obsidian Drive before unauthorized decryption leaks to external networks.",
        fears: ["His board of directors discovering Elena survived"],
        secrets: ["Elena Lin is alive in an offshore cryogenic containment site"],
        injuries: [],
        wardrobeNotes: "Tailored charcoal cashmere trench coat, silk scarf, titanium spectacles.",
        knowledgeByScene: {
          2: ["Bulkheads locked on sub-level 4", "Payload contents are unknown to Maya"]
        },
        relationships: [
          {
            targetCharacterId: "maya-lin",
            targetCharacterName: "Maya Lin",
            relationshipType: "Target / Loose End",
            notes: "Sees her as an intellectual prodigy that must be brought into the fold or eliminated."
          }
        ]
      }
    },
    canon: [
      {
        id: "canon-drive-timeout",
        category: "prop",
        title: "Obsidian Titanium Drive Timeout",
        statement:
          "The Obsidian Drive has an internal cryptographic self-purge mechanism that triggers if disconnected from biocentric power for over 180 seconds.",
        status: "locked",
        firstSeenSceneNumber: 1,
        sourceLineIds: ["line-sample-1"],
        locked: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "canon-maya-secret",
        category: "secret",
        title: "Maya's Elena Investigation",
        statement:
          "Maya Lin never informed Marcus that her primary motivation for the vault heist was discovering her sister Elena's fate.",
        status: "approved",
        firstSeenSceneNumber: 1,
        sourceLineIds: ["line-sample-2"],
        locked: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "canon-vault-security",
        category: "world-rule",
        title: "Vault 7 Halon Protocol",
        statement:
          "Vault 7 is sealed with atmospheric halon fire-suppression gas that depletes oxygen in 40 seconds upon trigger.",
        status: "locked",
        firstSeenSceneNumber: 1,
        sourceLineIds: ["line-sample-3"],
        locked: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "canon-marcus-wound",
        category: "character",
        title: "Marcus Facial Shrapnel",
        statement: "Marcus Kane carries a fresh shrapnel wound on his left cheek from the entry breach.",
        status: "approved",
        firstSeenSceneNumber: 1,
        sourceLineIds: ["line-sample-4"],
        locked: false,
        createdAt: now,
        updatedAt: now
      }
    ],
    breakdown: {
      lastUpdated: now,
      elements: [
        {
          id: "bk-1-1",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "cast",
          name: "MAYA LIN",
          isAiSuggested: false,
          isConfirmed: true,
          locked: true
        },
        {
          id: "bk-1-2",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "cast",
          name: "MARCUS KANE",
          isAiSuggested: false,
          isConfirmed: true,
          locked: true
        },
        {
          id: "bk-1-3",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "props",
          name: "Encrypted Titanium Drive",
          isAiSuggested: true,
          isConfirmed: true,
          locked: true
        },
        {
          id: "bk-1-4",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "props",
          name: "Suppressed Carbine",
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-1-5",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "wardrobe",
          name: "Tactical Kevlar Vest",
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-1-6",
          sceneId: "scene-1",
          sceneNumber: 1,
          category: "sfx",
          name: "Server Monolith Mist & Atmospheric Halon Gas",
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-2-1",
          sceneId: "scene-2",
          sceneNumber: 2,
          category: "cast",
          name: "DR. ARIS THORNE",
          isAiSuggested: false,
          isConfirmed: true,
          locked: true
        },
        {
          id: "bk-2-2",
          sceneId: "scene-2",
          sceneNumber: 2,
          category: "extras",
          name: "2 Armed Mercenaries",
          quantity: 2,
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-2-3",
          sceneId: "scene-2",
          sceneNumber: 2,
          category: "vehicles",
          name: "Stealth Rotor Transport Helicopter",
          isAiSuggested: true,
          isConfirmed: true,
          locked: true
        },
        {
          id: "bk-2-4",
          sceneId: "scene-2",
          sceneNumber: 2,
          category: "sfx",
          name: "Rain FX & 40-Knot Wind Machine",
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-3-1",
          sceneId: "scene-3",
          sceneNumber: 3,
          category: "stunts",
          name: "Breach Fire & Reinforced Doorway Sparks",
          isAiSuggested: true,
          isConfirmed: true,
          locked: false
        },
        {
          id: "bk-4-1",
          sceneId: "scene-4",
          sceneNumber: 4,
          category: "props",
          name: "Waterproof Asset Pouch with Pulsing Hologram",
          isAiSuggested: true,
          isConfirmed: true,
          locked: true
        }
      ]
    },
    actorPackets: {
      "maya-lin": {
        id: "ap-maya-lin",
        characterId: "maya-lin",
        characterName: "Maya Lin",
        lastGeneratedAt: now,
        screenplayVersion: 2,
        isStale: false,
        scenes: [
          {
            sceneId: "scene-1",
            sceneNumber: 1,
            sceneHeading: "INT. CYBER VAULT 7 - NIGHT",
            dramaticObjective: "Bypass the 16ms dynamic cipher without triggering the halon lock.",
            emotionalState: "Hyper-focused, racing adrenaline, concealing desperation.",
            wardrobeCheck: "Tactical Kevlar vest, fingerless hacking gloves, combat harness.",
            propsRequired: ["Encrypted Titanium Drive", "Cyber Interface Tablet"],
            secretsKnown: ["Elena's hidden signature is encoded in the root certificate"],
            cues: [
              {
                lineId: "cue-m-1",
                cueSpeaker: "MARCUS",
                cueLine: "Tell me you've bypassed the biocentric firewall.",
                dialogueLines: [
                  "The firewall isn't the problem, Marcus. The cipher matrix is dynamically rebuilding every sixteen milliseconds.",
                  "Hold the door. If this feedback loop trips, the halon suppression system will suffocate us in under forty seconds."
                ]
              }
            ]
          },
          {
            sceneId: "scene-3",
            sceneNumber: 3,
            sceneHeading: "INT. SUB-LEVEL LAB - CONTINUOUS",
            dramaticObjective: "Sever terminal connections and escape before perimeter lockdown.",
            emotionalState: "Frenzied survival, resolute quick-thinking.",
            wardrobeCheck: "Slight soot on Kevlar from electrical fire.",
            propsRequired: ["Encrypted Titanium Drive"],
            secretsKnown: [],
            cues: [
              {
                lineId: "cue-m-3",
                cueSpeaker: "MARCUS",
                cueLine: "Tell me you're joking. That flume drops eighty feet into freezing industrial runoff.",
                dialogueLines: ["Do you want to explain that to Thorne, or do you want to jump?"]
              }
            ]
          },
          {
            sceneId: "scene-4",
            sceneNumber: 4,
            sceneHeading: "EXT. TOKYO INDUSTRIAL DOCKS - RAIN - DAWN",
            dramaticObjective: "Verify the decrypted manifest data and process the shock of Elena's involvement.",
            emotionalState: "Exhausted, shivering, devastated revelation.",
            wardrobeCheck: "Soaked combat uniform, dripping hair, sea spray.",
            propsRequired: ["Encrypted Titanium Drive with Blue Hologram"],
            secretsKnown: ["Elena authored the master weapon prototype"],
            cues: [
              {
                lineId: "cue-m-4",
                cueSpeaker: "MARCUS",
                cueLine: "What is it?",
                dialogueLines: [
                  "Thorne didn't steal this prototype from the military. My sister designed it three years before she disappeared."
                ]
              }
            ]
          }
        ]
      },
      "marcus-kane": {
        id: "ap-marcus-kane",
        characterId: "marcus-kane",
        characterName: "Marcus Kane",
        lastGeneratedAt: now,
        screenplayVersion: 2,
        isStale: false,
        scenes: [
          {
            sceneId: "scene-1",
            sceneNumber: 1,
            sceneHeading: "INT. CYBER VAULT 7 - NIGHT",
            dramaticObjective: "Guard the breach portal and manage the exfil countdown.",
            emotionalState: "Hyper-vigilant, tense combat readiness.",
            wardrobeCheck: "Grey combat jacket, shrapnel scar on left cheek.",
            propsRequired: ["Suppressed Carbine", "Tactical Tracker"],
            secretsKnown: [],
            cues: [
              {
                lineId: "cue-mk-1",
                cueSpeaker: "MAYA",
                cueLine: "Hold the door. If this feedback loop trips, the halon suppression system will suffocate us in under forty seconds.",
                dialogueLines: ["Comforting as always.", "We've got company on the service lift. Heavy armor."]
              }
            ]
          }
        ]
      }
    },
    shotLists: {
      1: {
        sceneId: "scene-1",
        sceneNumber: 1,
        isStale: false,
        shots: [
          {
            id: "shot-1-1",
            sceneNumber: 1,
            shotNumber: 1,
            size: "establishing",
            lens: "24mm Master Prime",
            angle: "Low Angle Slow Push",
            movement: "Slow mechanical push on motorized dolly",
            description: "Wide shot of Cyber Vault 7. Cold blue hue, steam rising from floor grills.",
            visualIntent: "Establish cold, oppressive scale of the underground monolith.",
            blockingNotes: "Maya positioned center terminal; Marcus pacing perimeter right.",
            sourceLineIds: [],
            status: "approved"
          },
          {
            id: "shot-1-2",
            sceneNumber: 1,
            shotNumber: 2,
            size: "extreme-close-up",
            lens: "65mm Macro",
            angle: "Dutch Angle",
            movement: "Handheld micro-jitters",
            description: "Maya's eyes reflecting emerald matrix code; fingers flying on the keys.",
            visualIntent: "Convey immense mental velocity and tension.",
            blockingNotes: "Maya does not blink; sweat glints along temple.",
            sourceLineIds: [],
            status: "approved"
          },
          {
            id: "shot-1-3",
            sceneNumber: 1,
            shotNumber: 3,
            size: "medium",
            lens: "35mm",
            angle: "Over Shoulder",
            movement: "Pan to entry lift",
            description: "Over Marcus's shoulder as tactical tracker blinks red warnings.",
            visualIntent: "Impending claustrophobic doom.",
            blockingNotes: "Marcus turns sharply toward vault blast door.",
            sourceLineIds: [],
            status: "proposed"
          }
        ]
      }
    },
    revisions: [
      {
        id: "rev-white-1",
        color: "White",
        label: "First Writer Draft",
        screenplayText: SAMPLE_SCREENPLAY_TEXT,
        createdAt: "2026-09-01T10:00:00.000Z",
        author: "Kapasai Nitish Reddy",
        summaryOfChanges: "Initial complete 4-scene heist and revelation sequence.",
        changedSceneNumbers: [1, 2, 3, 4],
        stats
      },
      {
        id: "rev-blue-2",
        color: "Blue",
        label: "Production Polish Revision",
        screenplayText: SAMPLE_SCREENPLAY_TEXT,
        createdAt: now,
        author: "Kapasai Nitish Reddy",
        summaryOfChanges: "Clarified Elena's manifest twist in Scene 4, expanded helipad storm dialogue.",
        changedSceneNumbers: [2, 4],
        stats
      }
    ],
    continuityIssues: [
      {
        id: "issue-1",
        category: "injury",
        severity: "info",
        affectedScenes: [1, 4],
        affectedCharacters: ["marcus-kane"],
        headline: "Marcus Left Cheek Shrapnel Wound Continuity",
        reason: "Marcus sustains facial shrapnel in Scene 1; verify makeup continuity after water submersion in Scene 4.",
        supportingEvidence:
          "Scene 1 states 'shrapnel scar across his left cheek'; Scene 4 takes place in rain/dock runoff where blood may wash off.",
        suggestedResolution: "Add note to Scene 4 wardrobe/makeup: shrapnel wound visibly inflamed and stinging from saltwater.",
        status: "active",
        createdAt: now
      }
    ],
    meetingNotes: [
      {
        id: "note-1",
        sceneNumber: 4,
        characterId: "maya-lin",
        type: "decision",
        title: "Elena Sister Reveal Timing",
        content:
          "Agreed in table read: Maya should NOT reveal Elena is alive until the end of Act 2; here she only knows Elena designed the prototype.",
        status: "accepted",
        speaker: "Director",
        createdAt: now
      },
      {
        id: "note-2",
        sceneNumber: 2,
        characterId: "dr-aris-thorne",
        type: "suggestion",
        title: "Thorne Trench Coat & Wind",
        content: "Make sure sound team captures clean lavalier audio despite the 40-knot wind fans on the helipad.",
        status: "proposed",
        speaker: "Sound Supervisor",
        createdAt: now
      }
    ],
    corkboardCards: [
      {
        id: "cb-1",
        type: "scene",
        title: "Scene 1: The Breach",
        synopsis: "Maya and Marcus crack the Vault 7 terminal while security lifts descend.",
        sceneNumber: 1,
        act: 1,
        color: "#3b82f6",
        tags: ["heist", "cyber", "tension"],
        order: 1
      },
      {
        id: "cb-2",
        type: "scene",
        title: "Scene 2: Thorne's Perimeter",
        synopsis: "Dr. Thorne arrives via stealth helicopter to order complete quarantine lockdown.",
        sceneNumber: 2,
        act: 1,
        color: "#ef4444",
        tags: ["antagonist", "helipad", "storm"],
        order: 2
      },
      {
        id: "cb-3",
        type: "scene",
        title: "Scene 3: The Drainage Leap",
        synopsis: "Doorway breaches; Marcus and Maya plunge down the 80ft storm flume.",
        sceneNumber: 3,
        act: 2,
        color: "#f59e0b",
        tags: ["action", "stunt", "escape"],
        order: 3
      },
      {
        id: "cb-4",
        type: "scene",
        title: "Scene 4: The Revelation",
        synopsis: "On the rain-soaked docks, the decrypted drive reveals Maya's sister was the weapon's creator.",
        sceneNumber: 4,
        act: 2,
        color: "#8b5cf6",
        tags: ["twist", "emotional-peak", "sister"],
        order: 4
      }
    ],
    proposals: [],
    researchFindings: [
      {
        id: "res-1",
        sceneNumber: 1,
        query: "Halon 1301 fire suppression system evacuation time safety limits",
        summary: "Verified NFPA 12A standard: Halon 1301 total flooding systems necessitate emergency personnel egress within 40-60 seconds before oxygen depletion.",
        conclusion: "Maya's line 'the halon suppression system will suffocate us in under forty seconds' is technically accurate to NFPA safety standards.",
        confidence: 0.96,
        sources: [
          {
            title: "NFPA 12A Standard on Halon 1301 Fire Extinguishing Systems",
            url: "https://www.nfpa.org/codes-and-standards/nfpa-12a-standard-development",
            snippet: "Atmospheric halon total flooding systems extinguish fires by chemically interrupting combustion; evacuation required within 40 seconds before hypoxia risks."
          }
        ],
        status: "APPROVED",
        retrievedAt: now,
        isParallelApiResult: true
      },
      {
        id: "res-2",
        sceneNumber: 4,
        query: "Tokyo harbor industrial drainage storm flume maritime regulations",
        summary: "Tokyo Metropolitan Bureau of Port and Harbor guidelines for underground tidal runoff culverts.",
        conclusion: "Underground discharge flumes in Tokyo Bay feature emergency access grating opening directly onto commercial mooring slips.",
        confidence: 0.92,
        sources: [
          {
            title: "Tokyo Port and Harbor Bureau — Industrial Waterfront Storm Runoff Guidelines",
            url: "https://www.kouwan.metro.tokyo.lg.jp/en/environment/runoff-discharge.html",
            snippet: "Tokyo Bay maritime drainage networks feature tidal backflow flaps and industrial storm flumes regulated by Tokyo Metropolitan Bureau."
          }
        ],
        status: "APPROVED",
        retrievedAt: now,
        isParallelApiResult: true
      }
    ],
    scene3DObjects: [
      {
        id: "obj-maya",
        sceneNumber: 1,
        label: "Maya Lin (Terminal)",
        kind: "actor",
        position: { x: 0, y: 0.9, z: 0 },
        color: "#3b82f6",
        notes: "Kneeling before primary server monolith"
      },
      {
        id: "obj-marcus",
        sceneNumber: 1,
        label: "Marcus Kane (Perimeter)",
        kind: "actor",
        position: { x: 2.4, y: 0.9, z: 1.5 },
        color: "#10b981",
        notes: "Suppressed carbine trained on service lift"
      },
      {
        id: "obj-camera-a",
        sceneNumber: 1,
        label: "Camera A (24mm Low Angle)",
        kind: "camera",
        position: { x: -1.8, y: 0.7, z: 3.2 },
        color: "#f59e0b",
        notes: "Motorized track pushing inward"
      },
      {
        id: "obj-terminal",
        sceneNumber: 1,
        label: "Vault Console Monolith",
        kind: "prop",
        position: { x: 0, y: 1.2, z: -0.8 },
        color: "#6366f1",
        notes: "Active luminescent biometric port"
      },
      {
        id: "obj-door",
        sceneNumber: 1,
        label: "Blast Door Barrier",
        kind: "prop",
        position: { x: 3.5, y: 1.5, z: 1.5 },
        color: "#ef4444",
        notes: "Hydraulic pressure seal"
      }
    ],
    dependencyEdges: [
      { id: "edge-1", source: "scene-1", target: "actor-maya-lin", type: "affects-character", label: "Speaking Lead" },
      { id: "edge-2", source: "scene-1", target: "actor-marcus-kane", type: "affects-character", label: "Speaking Lead" },
      { id: "edge-3", source: "scene-1", target: "prop-titanium-drive", type: "requires-prop", label: "Breach Asset" },
      { id: "edge-4", source: "scene-1", target: "res-1", type: "grounded-by-research", label: "Parallel Verified" },
      { id: "edge-5", source: "scene-1", target: "packet-maya-lin", type: "invalidates-packet", label: "Generates Cues" },
      { id: "edge-6", source: "scene-4", target: "res-2", type: "grounded-by-research", label: "Parallel Verified" }
    ],
    extractions: {
      1: extractScene(SAMPLE_SCREENPLAY_TEXT, 1),
      2: extractScene(SAMPLE_SCREENPLAY_TEXT, 2),
      3: extractScene(SAMPLE_SCREENPLAY_TEXT, 3),
      4: extractScene(SAMPLE_SCREENPLAY_TEXT, 4)
    },
    storyboardSequences: {
      1: generateStoryboardSequence(extractScene(SAMPLE_SCREENPLAY_TEXT, 1)),
      2: generateStoryboardSequence(extractScene(SAMPLE_SCREENPLAY_TEXT, 2)),
      3: generateStoryboardSequence(extractScene(SAMPLE_SCREENPLAY_TEXT, 3)),
      4: generateStoryboardSequence(extractScene(SAMPLE_SCREENPLAY_TEXT, 4))
    },
    storyThreads: [
      {
        id: "thread-obsidian-drive",
        title: "The Obsidian Quantum Cyber-Weapon",
        category: "prop",
        description: "A quantum-encrypted prototype drive with a self-purging biocentric fail-safe.",
        firstSeenSceneNumber: 1,
        scenesInvolved: [1, 2, 3, 4],
        charactersInvolved: ["maya-lin", "marcus-kane", "dr-aris-thorne"],
        setups: [
          { sceneNumber: 1, description: "Drive extracted from Vault 7 before automated purge trips." },
          { sceneNumber: 2, description: "Dr. Thorne orders sub-level lockdown to prevent exfiltration." }
        ],
        payoffs: [
          { sceneNumber: 3, description: "Marcus shatters lock relays to escape with drive.", resolved: true },
          { sceneNumber: 4, description: "Drive decoded, revealing Elena's cryptographic master manifest.", resolved: true }
        ],
        unresolvedPoints: ["What payload is inside the Obsidian core?"],
        status: "active"
      },
      {
        id: "thread-elena-investigation",
        title: "Maya's Investigation into Elena's Disappearance",
        category: "mystery",
        description: "Maya's secret motivation: proving her sister was framed and disappeared by Thorne's syndicate.",
        firstSeenSceneNumber: 1,
        scenesInvolved: [1, 4],
        charactersInvolved: ["maya-lin", "marcus-kane"],
        setups: [
          { sceneNumber: 1, description: "Maya refuses to reveal personal motivation to Marcus." }
        ],
        payoffs: [
          { sceneNumber: 4, description: "Timestamp confirms Elena designed prototype 3 years prior.", resolved: true }
        ],
        unresolvedPoints: ["Where is Elena Lin currently held?"],
        status: "active"
      },
      {
        id: "thread-marcus-escape",
        title: "Marcus Kane's Escape Route & Physical Toll",
        category: "character-arc",
        description: "Mercenary survival instincts tested by high-voltage drops and shrapnel wounds.",
        firstSeenSceneNumber: 1,
        scenesInvolved: [1, 3, 4],
        charactersInvolved: ["marcus-kane"],
        setups: [
          { sceneNumber: 1, description: "Scar across cheek and suppressed carbine trained on lift." }
        ],
        payoffs: [
          { sceneNumber: 4, description: "Drags himself onto pier wincing from bruised ribs.", resolved: true }
        ],
        unresolvedPoints: [],
        status: "resolved"
      }
    ],
    latestImpactReport: null,
    propagationState: {
      lastEvaluatedVersion: 2,
      staleActorPackets: [],
      staleShotLists: [],
      staleBreakdownScenes: [],
      flaggedContinuityScenes: [],
      staleStoryboardPanels: [],
      auditTrail: [
        {
          id: "prop-init",
          timestamp: now,
          source: "user-edit",
          affectedScenes: [1, 2, 3, 4],
          affectedCharacters: ["maya-lin", "marcus-kane", "dr-aris-thorne"],
          invalidatedArtifacts: [],
          details: "Initial project graph compilation from master screenplay."
        }
      ]
    },
    settings: {
      defaultRevisionColor: "Blue",
      activeProvider: "google-gemini",
      providers: {
        "google-gemini": { provider: "google-gemini", model: "gemini-1.5-pro", isDefault: true },
        "google-adk": { provider: "google-adk", model: "google-cloud-agent-adk", isDefault: false },
        "parallel-search": { provider: "parallel-search", model: "parallel-search-v1", isDefault: false },
        "google-deterministic": { provider: "google-deterministic", model: "deterministic-nlp-v1", isDefault: false }
      },
      typography: {
        fontFamily: "'Courier Prime', Courier, monospace",
        fontSize: 12,
        lineSpacing: 1.2
      },
      editorMode: "standard",
      theme: "dark",
      autosaveIntervalMs: 5000
    },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: now
  };
}

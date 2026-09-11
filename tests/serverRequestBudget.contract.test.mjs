import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schemas = await readFile(new URL("../server/src/schemas.ts", import.meta.url), "utf8");
const server = await readFile(new URL("../server/src/index.ts", import.meta.url), "utf8");

test("Parallel Search fan-out is capped before provider execution", () => {
  assert.match(schemas, /researchMaxResults:\s*8/);
  assert.match(schemas, /maxResults:\s*z\.number\(\)\.int\(\)\.positive\(\)\.max\(REQUEST_LIMITS\.researchMaxResults\)/);
});

test("research prompts have explicit character ceilings", () => {
  assert.match(schemas, /researchQueryChars:\s*500/);
  assert.match(schemas, /researchObjectiveChars:\s*1_000/);
  assert.match(schemas, /query:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(REQUEST_LIMITS\.researchQueryChars\)/);
  assert.match(schemas, /objective:\s*z\.string\(\)\.trim\(\)\.min\(1\)\.max\(REQUEST_LIMITS\.researchObjectiveChars\)/);
});

test("Gemini change-impact text inputs are bounded", () => {
  assert.match(schemas, /revisionTextChars:\s*50_000/);
  assert.match(schemas, /screenplayTextChars:\s*250_000/);
  assert.match(schemas, /beforeText:\s*z\.string\(\)\.max\(REQUEST_LIMITS\.revisionTextChars\)/);
  assert.match(schemas, /afterText:\s*z\.string\(\)\.max\(REQUEST_LIMITS\.revisionTextChars\)/);
  assert.match(schemas, /screenplayText:\s*z\.string\(\)\.max\(REQUEST_LIMITS\.screenplayTextChars\)/);
});

test("provider-driving collections have cardinality ceilings", () => {
  assert.match(schemas, /changedEntities:\s*z\.array\(BoundedEntitySchema\)\.max\(REQUEST_LIMITS\.changedEntities\)/);
  assert.match(schemas, /allScenes:\s*z\.array\(SceneContextSchema\)\.max\(REQUEST_LIMITS\.allScenes\)/);
  assert.match(schemas, /existingArtifacts:\s*z\.array\(ExistingArtifactSchema\)\.max\(REQUEST_LIMITS\.existingArtifacts\)/);
});

test("nested scene context is bounded before entering agent state", () => {
  assert.match(schemas, /heading:\s*z\.string\(\)\.trim\(\)\.max\(REQUEST_LIMITS\.sceneHeadingChars\)/);
  assert.match(schemas, /characters:\s*z\.array\(BoundedEntitySchema\)\.max\(REQUEST_LIMITS\.sceneEntities\)/);
  assert.match(schemas, /props:\s*z\.array\(BoundedEntitySchema\)\.max\(REQUEST_LIMITS\.sceneEntities\)/);
});

test("Express rejects oversized JSON before agent validation", () => {
  assert.match(server, /express\.json\(\{\s*limit:\s*"1mb"\s*\}\)/);
  assert.doesNotMatch(server, /express\.json\(\{\s*limit:\s*"10mb"\s*\}\)/);
});

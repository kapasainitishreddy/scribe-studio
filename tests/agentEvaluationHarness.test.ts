import { describe, it, expect } from "vitest";
import { runEvaluationSuite, generateEvaluationScenarios } from "../packages/continuity-engine/src/evaluationHarness";
import * as fs from "fs";
import * as path from "path";

describe("Autonomous Agent Evaluation Harness (50+ Multi-Scenario Benchmark)", () => {
  it("generates at least 50 distinct test scenarios across 26 categories including hard negatives", () => {
    const scenarios = generateEvaluationScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(50);

    const hardNegatives = scenarios.filter((s) => s.isHardNegative);
    expect(hardNegatives.length).toBeGreaterThanOrEqual(15);

    // Verify distinct categories
    const categories = new Set(scenarios.map((s) => s.category));
    expect(categories.size).toBeGreaterThanOrEqual(15);
  });

  it("executes the evaluation suite and computes mathematical metrics meeting benchmark thresholds", async () => {
    const suiteResult = await runEvaluationSuite();
    const { metrics, results } = suiteResult;

    // Output summary
    console.log("=== EVALUATION SUITE METRICS ===");
    console.log(`Total Scenarios: ${metrics.totalScenarios}`);
    console.log(`Passed Scenarios: ${metrics.passedScenarios} / ${metrics.totalScenarios}`);
    console.log(`Overall Accuracy: ${(metrics.overallAccuracy * 100).toFixed(1)}%`);
    console.log(`Continuity Precision: ${(metrics.continuityDetection.precision * 100).toFixed(1)}%`);
    console.log(`Continuity Recall: ${(metrics.continuityDetection.recall * 100).toFixed(1)}%`);
    console.log(`Continuity F1: ${(metrics.continuityDetection.f1Score * 100).toFixed(1)}%`);
    console.log(`False Positive Rate: ${(metrics.continuityDetection.falsePositiveRate * 100).toFixed(1)}%`);
    console.log(`Zero-Compute Protection Rate: ${(metrics.selectiveInvalidation.zeroComputeProtectionRate * 100).toFixed(1)}%`);
    console.log(`Research Trigger Precision: ${(metrics.researchGating.triggerPrecision * 100).toFixed(1)}%`);
    console.log(`Research Abstention Accuracy: ${(metrics.researchGating.abstentionAccuracy * 100).toFixed(1)}%`);

    const failedScenarios = results.filter((r) => !r.passed);
    console.log("Failed Scenarios:", failedScenarios.map((f) => ({ id: f.scenarioId, notes: f.notes })));

    // Verify thresholds
    expect(metrics.totalScenarios).toBeGreaterThanOrEqual(50);
    expect(metrics.overallAccuracy).toBeGreaterThanOrEqual(0.90);
    expect(metrics.continuityDetection.precision).toBeGreaterThanOrEqual(0.85);
    expect(metrics.continuityDetection.recall).toBeGreaterThanOrEqual(0.85);
    expect(metrics.continuityDetection.falsePositiveRate).toBeLessThanOrEqual(0.10);
    expect(metrics.selectiveInvalidation.zeroComputeProtectionRate).toBe(1.0); // Zero wasted compute guarantee!
    expect(metrics.researchGating.abstentionAccuracy).toBeGreaterThanOrEqual(0.90);

    // Save metrics to evaluation-results/evaluation_metrics.json
    const outputDir = path.resolve(process.cwd(), "evaluation-results");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "evaluation_metrics.json");
    fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2), "utf-8");
    expect(fs.existsSync(outputPath)).toBe(true);
  }, 30000);
});

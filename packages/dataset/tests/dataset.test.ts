import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { DatasetExporter, DatasetRecord } from "../src/index.js";

describe("@kazi-ai/dataset", () => {
  it("should export dataset records to JSONL with metadata", () => {
    const records: DatasetRecord[] = [
      {
        task_id: "coding.fix-auth",
        task_version: "1.0.0",
        agent: "reference",
        model: "gpt-4o",
        seed: 42,
        success: true,
        score: 0.95,
        trajectory: [],
        metrics: { steps: 5 },
        verification: { passed: true },
        exported_at: new Date().toISOString(),
      },
    ];

    const outPath = path.resolve(process.cwd(), ".sandbox/dataset_test.jsonl");
    const meta = DatasetExporter.exportToJsonl(records, outPath);

    expect(meta.totalRecords).toBe(1);
    expect(meta.successfulRecords).toBe(1);
    expect(fs.existsSync(outPath)).toBe(true);

    const metaPath = outPath.replace(/\.jsonl$/i, ".meta.json");
    expect(fs.existsSync(metaPath)).toBe(true);

    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  });
});

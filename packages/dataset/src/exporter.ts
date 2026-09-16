import fs from "fs";
import path from "path";
import { DatasetRecord, DatasetMetadata } from "./types.js";

export class DatasetExporter {
  public static exportToJsonl(records: DatasetRecord[], outputPath: string): DatasetMetadata {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const lines = records.map((r) => JSON.stringify(r)).join("\n");
    fs.writeFileSync(outputPath, lines + "\n", "utf-8");

    const successfulRecords = records.filter((r) => r.success).length;

    const meta: DatasetMetadata = {
      name: path.basename(outputPath),
      version: "1.0.0",
      totalRecords: records.length,
      successfulRecords,
      createdAt: new Date().toISOString(),
      schemaVersion: "1.0.0",
    };

    const metaPath = outputPath.replace(/\.jsonl$/i, ".meta.json");
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

    return meta;
  }

  public static exportToJson(records: DatasetRecord[], outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), "utf-8");
  }
}

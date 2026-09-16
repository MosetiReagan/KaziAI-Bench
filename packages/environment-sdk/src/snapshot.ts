import fs from "fs";
import path from "path";
import crypto from "crypto";
import { EnvironmentSnapshot } from "./types.js";
import { nanoid } from "nanoid";

export interface FilesystemDiff {
  added: string[];
  modified: string[];
  deleted: string[];
}

export class SnapshotManager {
  public static async captureSnapshot(dirPath: string): Promise<EnvironmentSnapshot> {
    const manifest = new Map<string, string>();
    this.walkDirectory(dirPath, "", manifest);

    return {
      id: `snap_${nanoid(10)}`,
      createdAt: new Date().toISOString(),
      fileManifest: manifest,
      metadata: { dirPath },
    };
  }

  public static compare(before: EnvironmentSnapshot, after: EnvironmentSnapshot): FilesystemDiff {
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Check additions and modifications
    for (const [file, hash] of after.fileManifest.entries()) {
      if (!before.fileManifest.has(file)) {
        added.push(file);
      } else if (before.fileManifest.get(file) !== hash) {
        modified.push(file);
      }
    }

    // Check deletions
    for (const file of before.fileManifest.keys()) {
      if (!after.fileManifest.has(file)) {
        deleted.push(file);
      }
    }

    return { added, modified, deleted };
  }

  private static walkDirectory(baseDir: string, relativeDir: string, manifest: Map<string, string>): void {
    const currentDir = path.join(baseDir, relativeDir);
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;

      const relPath = path.join(relativeDir, entry.name);
      const fullPath = path.join(baseDir, relPath);

      if (entry.isDirectory()) {
        this.walkDirectory(baseDir, relPath, manifest);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath);
          const hash = crypto.createHash("sha256").update(content).digest("hex");
          manifest.set(relPath, hash);
        } catch {
          // ignore unreadable files
        }
      }
    }
  }
}

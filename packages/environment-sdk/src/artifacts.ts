import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Artifact } from "@kazi-ai/core";

export class ArtifactCollector {
  public static async collect(
    workspaceDir: string,
    options: { maxSizeBytes?: number; allowedExtensions?: string[] } = {}
  ): Promise<Artifact[]> {
    const artifacts: Artifact[] = [];
    const maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB default cap

    if (!fs.existsSync(workspaceDir)) {
      return artifacts;
    }

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size > maxSizeBytes) continue;

            const ext = path.extname(entry.name);
            if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
              continue;
            }

            const content = fs.readFileSync(fullPath);
            const sha256 = crypto.createHash("sha256").update(content).digest("hex");

            artifacts.push({
              name: path.relative(workspaceDir, fullPath),
              path: fullPath,
              sizeBytes: stat.size,
              sha256,
            });
          } catch {
            // Ignore unreadable files
          }
        }
      }
    };

    walk(workspaceDir);
    return artifacts;
  }
}

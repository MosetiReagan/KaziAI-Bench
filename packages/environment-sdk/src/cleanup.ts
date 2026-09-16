import fs from "fs";
import { BenchmarkEnvironment } from "./types.js";

export class CleanupManager {
  private static registeredEnvironments: Set<BenchmarkEnvironment> = new Set();
  private static handlersInstalled = false;

  public static register(env: BenchmarkEnvironment): void {
    this.registeredEnvironments.add(env);
    this.installProcessHooks();
  }

  public static unregister(env: BenchmarkEnvironment): void {
    this.registeredEnvironments.delete(env);
  }

  public static async cleanupAll(): Promise<void> {
    const list = Array.from(this.registeredEnvironments);
    this.registeredEnvironments.clear();

    await Promise.allSettled(
      list.map(async (env) => {
        try {
          await env.destroy();
        } catch {
          // suppress cleanup errors on exit
        }
      })
    );
  }

  public static cleanDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  private static installProcessHooks(): void {
    if (this.handlersInstalled) return;
    this.handlersInstalled = true;

    const handler = async () => {
      await this.cleanupAll();
    };

    process.once("beforeExit", handler);
    process.once("SIGINT", async () => {
      await handler();
      process.exit(130);
    });
    process.once("SIGTERM", async () => {
      await handler();
      process.exit(143);
    });
  }
}

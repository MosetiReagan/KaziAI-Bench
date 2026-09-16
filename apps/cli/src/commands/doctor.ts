import { Command } from "commander";
import pc from "picocolors";
import { execSync } from "child_process";
import fs from "fs";

interface DiagnosticItem {
  name: string;
  category: "runtime" | "tool" | "container" | "filesystem";
  required: boolean;
  status: "ok" | "warning" | "error";
  version?: string;
  message: string;
  actionable?: string;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Verify local environment, Docker daemon, tool dependencies, and sandbox permissions")
    .action(async () => {
      console.log(pc.bold(pc.cyan(`\n  KaziAI Bench — System Health & Diagnostics`)));
      console.log(pc.dim(`  Checking local runtime dependencies and sandbox capabilities...\n`));

      const diagnostics: DiagnosticItem[] = [];

      // 1. Node.js
      try {
        const nodeVer = process.version;
        const major = parseInt(nodeVer.replace("v", "").split(".")[0] || "0", 10);
        diagnostics.push({
          name: "Node.js Runtime",
          category: "runtime",
          required: true,
          status: major >= 20 ? "ok" : "error",
          version: nodeVer,
          message: major >= 20 ? "Meets requirement (>= 20.0.0)" : "Requires Node.js 20 or higher",
          actionable: major < 20 ? "Upgrade Node using nvm: 'nvm install 22'" : undefined,
        });
      } catch (err) {
        diagnostics.push({
          name: "Node.js Runtime",
          category: "runtime",
          required: true,
          status: "error",
          message: String(err),
        });
      }

      // 2. pnpm
      try {
        const pnpmVer = execSync("pnpm --version", { encoding: "utf-8" }).trim();
        diagnostics.push({
          name: "pnpm Package Manager",
          category: "runtime",
          required: true,
          status: "ok",
          version: `v${pnpmVer}`,
          message: "Available and functional",
        });
      } catch {
        diagnostics.push({
          name: "pnpm Package Manager",
          category: "runtime",
          required: true,
          status: "error",
          message: "pnpm command not found",
          actionable: "Install pnpm globally: 'corepack enable' or 'npm install -g pnpm'",
        });
      }

      // 3. Git
      try {
        const gitVer = execSync("git --version", { encoding: "utf-8" }).trim();
        diagnostics.push({
          name: "Git VCS",
          category: "tool",
          required: true,
          status: "ok",
          version: gitVer,
          message: "Available for repository fixture cloning",
        });
      } catch {
        diagnostics.push({
          name: "Git VCS",
          category: "tool",
          required: true,
          status: "error",
          message: "git command not found",
          actionable: "Install git from https://git-scm.com or via system package manager",
        });
      }

      // 4. Docker
      try {
        const dockerVer = execSync("docker --version", { encoding: "utf-8" }).trim();
        let daemonOk = false;
        try {
          execSync("docker info", { stdio: "ignore" });
          daemonOk = true;
        } catch {
          daemonOk = false;
        }

        diagnostics.push({
          name: "Docker Engine",
          category: "container",
          required: false,
          status: daemonOk ? "ok" : "warning",
          version: dockerVer,
          message: daemonOk ? "Daemon is active (container sandboxing ready)" : "Docker CLI found, but daemon is not running",
          actionable: daemonOk ? undefined : "Start Docker Desktop or system dockerd service",
        });
      } catch {
        diagnostics.push({
          name: "Docker Engine",
          category: "container",
          required: false,
          status: "warning",
          message: "Docker not installed (local process sandbox fallback will be used)",
          actionable: "Install Docker for full container network isolation",
        });
      }

      // 5. SQLite3
      try {
        const sqliteVer = execSync("sqlite3 --version", { encoding: "utf-8" }).trim().split(" ")[0];
        diagnostics.push({
          name: "SQLite3 CLI",
          category: "tool",
          required: false,
          status: "ok",
          version: sqliteVer,
          message: "Available for database benchmark verification",
        });
      } catch {
        diagnostics.push({
          name: "SQLite3 CLI",
          category: "tool",
          required: false,
          status: "warning",
          message: "sqlite3 command not found",
          actionable: "Install sqlite3 CLI for database benchmark tasks",
        });
      }

      // 6. Sandbox Directory Permissions
      try {
        const testDir = ".sandbox/doctor_test";
        fs.mkdirSync(testDir, { recursive: true });
        const testFile = `${testDir}/perm_check.tmp`;
        fs.writeFileSync(testFile, "ok", "utf-8");
        fs.unlinkSync(testFile);
        fs.rmdirSync(testDir);
        diagnostics.push({
          name: "Sandbox Filesystem",
          category: "filesystem",
          required: true,
          status: "ok",
          message: "Read/Write permissions verified in .sandbox/",
        });
      } catch (err) {
        diagnostics.push({
          name: "Sandbox Filesystem",
          category: "filesystem",
          required: true,
          status: "error",
          message: `Cannot write to .sandbox directory: ${String(err)}`,
          actionable: "Check file permissions in the working directory",
        });
      }

      // Render diagnostic summary
      let hasError = false;
      for (const diag of diagnostics) {
        const icon = diag.status === "ok" ? pc.green("✓") : diag.status === "warning" ? pc.yellow("⚠") : pc.red("✗");
        const namePart = pc.bold(diag.name.padEnd(26));
        const verPart = diag.version ? pc.cyan(`(${diag.version}) `) : "";
        console.log(`  ${icon} ${namePart} ${verPart}${diag.message}`);
        if (diag.actionable) {
          console.log(pc.dim(`     ↳ Fix: ${diag.actionable}`));
        }
        if (diag.status === "error" && diag.required) {
          hasError = true;
        }
      }

      console.log("");
      if (hasError) {
        console.log(pc.bold(pc.red("  One or more required dependencies failed. Fix issues above to run benchmarks.\n")));
        process.exitCode = 1;
      } else {
        console.log(pc.bold(pc.green("  All required systems ready. KaziAI Bench is operational.\n")));
      }
    });
}

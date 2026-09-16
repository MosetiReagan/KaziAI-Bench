import fs from "fs";
import path from "path";
import { AgentTrajectory, TrajectoryEvent } from "./types.js";
import { SecretRedactor } from "./redactor.js";

export class TrajectoryStorage {
  private redactor: SecretRedactor;

  constructor(redactor: SecretRedactor = new SecretRedactor()) {
    this.redactor = redactor;
  }

  public saveJson(filePath: string, trajectory: AgentTrajectory): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sanitized = this.redactor.redactObject(trajectory);
    fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2), "utf-8");
  }

  public saveJsonl(filePath: string, trajectory: AgentTrajectory): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sanitized = this.redactor.redactObject(trajectory);
    const lines = sanitized.events.map((e) => JSON.stringify(e)).join("\n");
    fs.writeFileSync(filePath, lines + "\n", "utf-8");
  }

  public appendEventJsonl(filePath: string, event: TrajectoryEvent): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sanitized = this.redactor.redactObject(event);
    fs.appendFileSync(filePath, JSON.stringify(sanitized) + "\n", "utf-8");
  }

  public loadJson(filePath: string): AgentTrajectory {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Trajectory file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as AgentTrajectory;
  }

  public loadJsonlEvents(filePath: string): TrajectoryEvent[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Trajectory file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as TrajectoryEvent);
  }
}

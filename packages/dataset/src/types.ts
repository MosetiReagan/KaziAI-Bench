import { AgentTrajectory } from "@kazi-ai/tracing";

export interface DatasetRecord {
  task_id: string;
  task_version: string;
  agent: string;
  model: string;
  seed: string | number;
  success: boolean;
  score: number;
  trajectory: AgentTrajectory["events"];
  metrics: Record<string, unknown>;
  verification: Record<string, unknown>;
  exported_at: string;
}

export interface DatasetMetadata {
  name: string;
  version: string;
  totalRecords: number;
  successfulRecords: number;
  createdAt: string;
  schemaVersion: "1.0.0";
}

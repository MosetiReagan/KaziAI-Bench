import { WorkerQueue } from "./queue.js";

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
export const workerQueue = new WorkerQueue(concurrency);

console.log(`KaziAI Bench Background Worker started with concurrency: ${concurrency}`);

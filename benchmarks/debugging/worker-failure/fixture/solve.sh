#!/usr/bin/env bash
cat << 'EOF' > worker.js
class QueueWorker {
  constructor() {
    this.jobs = new Map();
  }

  addJob(id, fn) {
    this.jobs.set(id, { status: "pending", fn });
  }

  async processJob(id) {
    const job = this.jobs.get(id);
    if (!job) throw new Error("Job not found");

    job.status = "processing";
    try {
      const result = await job.fn();
      job.status = "completed";
      job.result = result;
      return job;
    } catch (err) {
      job.status = "failed";
      job.error = err.message || String(err);
      return job;
    }
  }
}

module.exports = { QueueWorker };
EOF

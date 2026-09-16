// Buggy queue worker: crashes on job rejection without updating job status
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
    // BUG: Missing try/catch - if fn() rejects or times out, worker crashes and status stays "processing"
    const result = await job.fn();
    job.status = "completed";
    job.result = result;
    return job;
  }
}

module.exports = { QueueWorker };

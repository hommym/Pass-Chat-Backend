"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobManager = void 0;
const cron_1 = require("cron");
class JobManager {
    constructor() {
        this.jobs = new Map();
    }
    addJob(jobType, data) {
        if (jobType === "storyAutoRemoval") {
            const { callBack, executionDate, jobId } = data;
            const job = new cron_1.CronJob(executionDate, callBack, null, true);
            this.jobs.set(jobId, { jobType, job });
        }
    }
    removeJob(jobId) {
        const jobObject = this.jobs.get(jobId);
        // checking any job with this id exist
        if (jobObject) {
            const job = jobObject.job;
            if (jobObject.jobType === "storyAutoRemoval") {
                if (!job.isCallbackRunning) {
                    job.stop();
                    return true;
                }
                this.jobs.delete(jobId);
            }
        }
        return false;
    }
}
exports.JobManager = JobManager;

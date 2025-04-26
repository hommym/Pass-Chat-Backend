export type JobType = "storyAutoRemoval" | "imgOptimizer"; // more will be added as we move

import { CronJob } from "cron";

type JobTypeDataMatch = {
  storyAutoRemoval: { jobId: number; executionDate: Date; callBack: () => Promise<void> };
};

export class JobManager {
  private jobs: Map<number, { jobType: JobType; job: CronJob }> = new Map();

  addJob<T extends keyof JobTypeDataMatch>(jobType: T, data: JobTypeDataMatch[T]) {
    if (jobType === "storyAutoRemoval") {
      const { callBack, executionDate, jobId } = data;
      const job = new CronJob(executionDate, callBack, null, true);

      this.jobs.set(jobId, { jobType, job });
    }
  }

  removeJob(jobId: number) {
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

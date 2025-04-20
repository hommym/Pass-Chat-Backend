import dotenv from "dotenv";
dotenv.config();
import si from "systeminformation";

export class ConcurrentTaskExec {
  // this class is used for performing a number of asyn task in parallel depending of system load

  private asyncTask: Promise<any>[];
  private maxConcurrentTask = process.env.MaxConcurrentTask ? +process.env.MaxConcurrentTask : 100000;
  private minConcurrentTask = process.env.MinConcurrentTask ? +process.env.MinConcurrentTask : 10000;

  constructor(asyncTask: Promise<any>[]) {
    this.asyncTask = asyncTask;
  }

  private async getSystemLoad() {
    const cpuUsed = (await si.currentLoad()).currentLoad / 100; // value between 0 and 1

    const memoryInfo = await si.mem();

    const memoryUsed = (memoryInfo.active / memoryInfo.total) * 1; // value between 0 and 1

    // console.log(`Cpu%Used=${cpuUsed * 100} , Memory%Used=${memoryUsed * 100}`);
    // calculate the whole system's load
    return cpuUsed * 0.6 + memoryUsed * 0.4; // Value btw 0 and 1
  }

  private async getNumConcurrentTasks() {
    // this method will get you the number of cocurrent task you can run base current system load
    const systemLoad = await this.getSystemLoad();
    // console.log(`SystemLoad=${systemLoad}`);
    return this.maxConcurrentTask - systemLoad * (this.maxConcurrentTask - this.minConcurrentTask);
  }

  async executeTasks() {
    const allowedNumConcurrentTasks = Math.round(await this.getNumConcurrentTasks());
    // console.log(`allowedConc=${allowedNumConcurrentTasks} , asyncTask=${this.asyncTask.length}\n`);

    if (allowedNumConcurrentTasks > this.asyncTask.length) {
      return await Promise.all(this.asyncTask);
    } else {
      let results: any[] = [];
      for (let i = 0; i < this.asyncTask.length; i += allowedNumConcurrentTasks) {
        const asyncTaskToBeExec = this.asyncTask.slice(i, i + allowedNumConcurrentTasks);

        if (results.length === 0) {
          results = await Promise.all(asyncTaskToBeExec);
        } else {
          results = [...results, ...(await Promise.all(asyncTaskToBeExec))];
        }
      }

      return results;
    }
  }
}

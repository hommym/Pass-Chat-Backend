import { exec } from "child_process";

export const execAsync = (command: string) => {
  // this method is for executing cmd commands in an asynchronous manner
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else resolve(stdout);
    });
  });
};

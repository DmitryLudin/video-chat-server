import cluster from 'node:cluster';
import { cpus } from 'node:os';

export function runInCluster(bootstrap: () => Promise<void>) {
  const numberOfCores = cpus().length;

  if (cluster?.isPrimary) {
    for (let i = 0; i < numberOfCores; ++i) {
      cluster.fork();
    }
  } else {
    bootstrap();
  }
}

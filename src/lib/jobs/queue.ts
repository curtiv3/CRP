import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

let connection: IORedis | undefined;

function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export interface EpisodeJobData {
  episodeId: string;
  userId: string;
}

let episodeQueue: Queue<EpisodeJobData> | undefined;

export function getEpisodeQueue(): Queue<EpisodeJobData> {
  if (!episodeQueue) {
    episodeQueue = new Queue<EpisodeJobData>("episode-processing", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return episodeQueue;
}

export async function addEpisodeJob(
  episodeId: string,
  userId: string,
): Promise<void> {
  const queue = getEpisodeQueue();
  await queue.add("process-episode", { episodeId, userId });
}

export function createEpisodeWorker(
  processor: (job: Job<EpisodeJobData>) => Promise<void>,
): Worker<EpisodeJobData> {
  const worker = new Worker<EpisodeJobData>(
    "episode-processing",
    processor,
    {
      connection: getRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed for episode ${job.data.episodeId}`);
  });

  return worker;
}

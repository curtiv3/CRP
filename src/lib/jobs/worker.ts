import { createEpisodeWorker } from "./queue";
import { processEpisode } from "./process-episode";

const worker = createEpisodeWorker(processEpisode);

console.log("Worker started, waiting for jobs...");

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}, shutting down worker...`);
  await worker.close();
  console.log("Worker closed.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

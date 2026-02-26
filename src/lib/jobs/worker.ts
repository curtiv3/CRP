import { createEpisodeWorker } from "./queue";
import { processEpisode } from "./process-episode";

const worker = createEpisodeWorker(processEpisode);

console.log("Episode processing worker started");

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

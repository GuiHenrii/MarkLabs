import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let postQueue: Queue | null = null;

function createQueue() {
  if (!REDIS_URL) return null;

  const connection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  return new Queue("PostQueue", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
    },
  });
}

export function getPostQueue() {
  if (!postQueue) {
    postQueue = createQueue();
  }
  return postQueue;
}

export async function enqueuePublishPost(jobData: { postId: string; teamId: string }) {
  const queue = getPostQueue();
  if (!queue) {
    return { queued: false as const };
  }

  await queue.add("publish-post", jobData);
  return { queued: true as const };
}

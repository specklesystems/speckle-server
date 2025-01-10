import { RequestObjectPreview } from '@/modules/previews/domain/operations'
import type { Queue } from 'bull'

export const requestObjectPreviewFactory =
  ({
    responseQueue,
    queue
  }: {
    responseQueue: string
    queue: Queue
  }): RequestObjectPreview =>
  async ({ jobId, token, url }) => {
    const payload = { jobId, token, url, responseQueue }
    await queue.add(payload, { removeOnComplete: true })
  }

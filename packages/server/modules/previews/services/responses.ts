import { ensureError } from '@speckle/shared'
import type { Logger } from '@/observability/logging'
import type { DoneCallback, Job } from 'bull'
import type {
  BuildConsumePreviewResult,
  ObserveMetrics
} from '@/modules/previews/domain/operations'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { fromJobId, previewResultPayload } from '@speckle/shared/workers/previews'

const parseMessage = (data: string) =>
  previewResultPayload
    .transform((data) => {
      const { projectId, objectId } = fromJobId(data.jobId)
      return {
        ...data,
        projectId,
        objectId
      }
    })
    .safeParse(data)

export const responseHandlerFactory = (deps: {
  consumePreviewResultBuilder: BuildConsumePreviewResult
  observeMetrics: ObserveMetrics
  logger: Logger
}) => {
  const { observeMetrics, logger, consumePreviewResultBuilder } = deps
  return async (payload: Pick<Job, 'attemptsMade' | 'data'>, done: DoneCallback) => {
    const { attemptsMade } = payload
    const parsedMessage = parseMessage(payload.data)
    if (!parsedMessage.success) {
      logger.error(
        { payload: payload.data, reason: parsedMessage.error },
        'Failed to parse previewResult payload'
      )

      // as we can't parse the response we neither have a job ID nor a duration,
      // we cannot get a duration to populate previewJobsProcessedSummary.observe

      done(parsedMessage.error)
      return
    }

    const parsedPayload = parsedMessage.data
    const { projectId, objectId } = parsedPayload
    const jobLogger = logger.child({
      projectId,
      objectId,
      responsePriorAttemptsMade: attemptsMade
    })

    try {
      observeMetrics({ payload: parsedPayload })

      const consumePreviewResult = await consumePreviewResultBuilder({
        logger: jobLogger,
        projectId
      })

      await consumePreviewResult({
        projectId,
        objectId,
        previewResult: parsedPayload
      })
    } catch (e) {
      const err = ensureError(e, 'Unknown error when consuming preview result')

      if (err instanceof StreamNotFoundError) {
        jobLogger.warn(
          { err },
          'Failed to consume preview result; the stream does not exist. Probably deleted while preview was generated.'
        )
        done() // don't pass the error to done, as we don't want to retry the job
        return
      }

      jobLogger.error({ err }, 'Failed to consume preview result')
      done(err)
      return
    }

    done()
  }
}

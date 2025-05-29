import { ensureError, TIME } from '@speckle/shared'
import { PreviewJobDurationStep } from '@/modules/previews/observability/metrics'
import type { Summary } from 'prom-client'
import type { Logger } from '@/observability/logging'
import type { DoneCallback, Job } from 'bull'
import type { BuildConsumePreviewResult } from '@/modules/previews/domain/operations'
import { DatabaseError } from 'pg'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { previewResultPayload } from '@speckle/shared/workers/previews'

const parseMessage = (data: string) =>
  previewResultPayload
    .refine((data) => data.jobId.split('.').length === 2, {
      message: 'jobId must be in the format "projectId.objectId"'
    })
    .transform((data) => ({
      ...data,
      projectId: data.jobId.split('.')[0],
      objectId: data.jobId.split('.')[1]
    }))
    .safeParse(data)

export const responseHandlerFactory = (deps: {
  consumePreviewResultBuilder: BuildConsumePreviewResult
  previewJobsProcessedSummary: Pick<Summary<'status' | 'step'>, 'observe'>
  logger: Logger
}) => {
  const { previewJobsProcessedSummary, logger, consumePreviewResultBuilder } = deps
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

    const parsedResult = parsedMessage.data
    const { projectId, objectId } = parsedResult
    const jobLogger = logger.child({
      projectId,
      objectId,
      responsePriorAttemptsMade: attemptsMade
    })

    try {
      const consumePreviewResult = await consumePreviewResultBuilder({
        logger: jobLogger,
        projectId
      })

      await consumePreviewResult({
        projectId,
        objectId,
        previewResult: parsedResult
      })
    } catch (e) {
      const err = ensureError(e, 'Unknown error when consuming preview result')

      if (
        err instanceof StreamNotFoundError ||
        (err instanceof DatabaseError &&
          err.constraint === 'object_preview_streamid_foreign' &&
          err.detail?.includes('is not present in table "streams".'))
      ) {
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

    previewJobsProcessedSummary.observe(
      { status: parsedResult.status, step: PreviewJobDurationStep.TOTAL },
      parsedResult.result.durationSeconds * TIME.second
    )
    if (parsedResult.result.loadDurationSeconds) {
      previewJobsProcessedSummary.observe(
        { status: parsedResult.status, step: PreviewJobDurationStep.LOAD },
        parsedResult.result.loadDurationSeconds * TIME.second
      )
    }
    if (parsedResult.result.renderDurationSeconds) {
      previewJobsProcessedSummary.observe(
        { status: parsedResult.status, step: PreviewJobDurationStep.RENDER },
        parsedResult.result.renderDurationSeconds * TIME.second
      )
    }

    done()
  }
}

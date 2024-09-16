import type { UpdateHealthcheckData } from '@/clients/execHealthcheck.js'
import {
  metricDuration,
  metricOperationErrors
} from '@/observability/prometheusMetrics.js'
import type {
  GetNextUnstartedObjectPreview,
  NotifyUpdate,
  UpdatePreviewMetadata
} from '@/repositories/objectPreview.js'
import type { GenerateAndStore360Preview } from '@/services/360preview.js'
import type { Logger } from 'pino'
import type { LabelValues } from 'prom-client'
import { WorkStatus, type WorkToBeDone } from '@/domain/backgroundWorker.js'

export const pollForAndCreatePreviewFactory =
  (deps: {
    updateHealthcheckData: UpdateHealthcheckData
    getNextUnstartedObjectPreview: GetNextUnstartedObjectPreview
    generateAndStore360Preview: GenerateAndStore360Preview
    updatePreviewMetadata: UpdatePreviewMetadata
    notifyUpdate: NotifyUpdate
    logger: Logger
  }): WorkToBeDone =>
  async () => {
    try {
      const task = await deps.getNextUnstartedObjectPreview()

      // notify the healthcheck that we are still alive
      deps.updateHealthcheckData()

      if (!task) {
        return WorkStatus.NOWORKFOUND
      }
      const logger = deps.logger.child({
        projectId: task.streamId,
        objectId: task.objectId
      })

      logger.info('Found next preview task for {projectId}/{objectId}')

      let metricDurationEnd:
        | (<T extends string>(labels?: LabelValues<T>) => number)
        | undefined = undefined
      if (metricDuration) {
        metricDurationEnd = metricDuration.startTimer()
      }

      try {
        const { metadata } = await deps.generateAndStore360Preview(task)

        await deps.updatePreviewMetadata({
          metadata,
          streamId: task.streamId,
          objectId: task.objectId
        })
        logger.info(
          { previewStatus: 'succeeded' },
          'Preview generation completed. Status: {previewStatus}'
        )

        await deps.notifyUpdate({ streamId: task.streamId, objectId: task.objectId })
      } catch (err) {
        logger.error(
          { err, previewStatus: 'failed' },
          'Preview generation completed. Status: {previewStatus}'
        )
        await deps.updatePreviewMetadata({
          metadata: { err: err instanceof Error ? err.message : JSON.stringify(err) },
          streamId: task.streamId,
          objectId: task.objectId
        })
        metricOperationErrors?.labels('preview').inc()
        return WorkStatus.FAILED
      }
      if (metricDurationEnd) {
        metricDurationEnd({ op: 'preview' })
      }

      return WorkStatus.SUCCESS
    } catch (err) {
      if (metricOperationErrors) {
        metricOperationErrors.labels('main_loop').inc()
      }
      deps.logger.error(err, 'Error executing task')
      return WorkStatus.FAILED
    }
  }

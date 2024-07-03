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

let shouldExit = false

export function forceExit() {
  shouldExit = true
}

type RepeatedlyPollForWork = () => void
export const repeatedlyPollForWorkFactory =
  (deps: {
    updateHealthcheckData: UpdateHealthcheckData
    getNextUnstartedObjectPreview: GetNextUnstartedObjectPreview
    generateAndStore360Preview: GenerateAndStore360Preview
    updatePreviewMetadata: UpdatePreviewMetadata
    notifyUpdate: NotifyUpdate
    onExit: () => void
    logger: Logger
  }): RepeatedlyPollForWork =>
  async () => {
    if (shouldExit) {
      deps.onExit()
      return
    }

    try {
      const task = await deps.getNextUnstartedObjectPreview()

      // notify the healthcheck that we are still alive
      deps.updateHealthcheckData()

      if (!task) {
        setTimeout(repeatedlyPollForWorkFactory(deps), 1000)
        return
      }

      let metricDurationEnd = undefined
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

        await deps.notifyUpdate({ streamId: task.streamId, objectId: task.objectId })
      } catch (err) {
        await deps.updatePreviewMetadata({
          metadata: { err: err instanceof Error ? err.message : JSON.stringify(err) },
          streamId: task.streamId,
          objectId: task.objectId
        })
        metricOperationErrors?.labels('preview').inc()
      }
      if (metricDurationEnd) {
        metricDurationEnd({ op: 'preview' })
      }

      // Check for another task very soon
      setTimeout(repeatedlyPollForWorkFactory(deps), 10)
    } catch (err) {
      if (metricOperationErrors) {
        metricOperationErrors.labels('main_loop').inc()
      }
      deps.logger.error(err, 'Error executing task')
      setTimeout(repeatedlyPollForWorkFactory(deps), 5000)
    }
  }

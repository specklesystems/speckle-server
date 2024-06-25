import type { UpdateHealthcheckData } from 'clients/execHealthcheck'
import {
  metricDuration,
  metricOperationErrors
} from '../observability/prometheusMetrics'
import type { GetNextUnstartedObjectPreview } from '../repositories/objectPreview'
import type { GenerateAndStore360Preview } from './360preview'
import type { Logger } from 'pino'

let shouldExit = false

export function forceExit() {
  shouldExit = true
}

type RepeatedlyPollForWork = () => Promise<void>
export const repeatedlyPollForWorkFactory =
  (deps: {
    updateHealthcheckData: UpdateHealthcheckData
    getNextUnstartedObjectPreview: GetNextUnstartedObjectPreview
    generateAndStore360Preview: GenerateAndStore360Preview
    logger: Logger
  }): RepeatedlyPollForWork =>
  async () => {
    if (shouldExit) {
      //FIXME should this return instead of exiting via the process?
      process.exit(0)
    }

    try {
      const task = await deps.getNextUnstartedObjectPreview()

      if (!task) {
        setTimeout(repeatedlyPollForWorkFactory(deps), 1000)
        return
      }

      let metricDurationEnd = undefined
      if (metricDuration) {
        metricDurationEnd = metricDuration.startTimer()
      }

      await deps.generateAndStore360Preview(task)

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

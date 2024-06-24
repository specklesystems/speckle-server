import { logger } from '../observability/logging'
import {
  metricDuration,
  metricOperationErrors
} from '../observability/prometheusMetrics'
import { getNextUnstartedObjectPreview } from '../repositories/objectPreview'
import { generateAndStore360Preview } from './360preview'
import fs from 'fs'

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'
let shouldExit = false

export function forceExit() {
  shouldExit = true
}

export async function repeatedlyPollForWork() {
  if (shouldExit) {
    //FIXME should this return instead of exiting via the process?
    process.exit(0)
  }

  try {
    const task = await getNextUnstartedObjectPreview()

    //FIXME we should not deal with file system in this service
    fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})

    if (!task) {
      setTimeout(repeatedlyPollForWork, 1000)
      return
    }

    let metricDurationEnd = undefined
    if (metricDuration) {
      metricDurationEnd = metricDuration.startTimer()
    }

    await generateAndStore360Preview(task)

    if (metricDurationEnd) {
      metricDurationEnd({ op: 'preview' })
    }

    // Check for another task very soon
    setTimeout(repeatedlyPollForWork, 10)
  } catch (err) {
    if (metricOperationErrors) {
      metricOperationErrors.labels('main_loop').inc()
    }
    logger.error(err, 'Error executing task')
    setTimeout(repeatedlyPollForWork, 5000)
  }
}

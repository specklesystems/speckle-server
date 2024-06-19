import { range } from '#lodash'

/**
 * Utility for batching async operations. Useful when you have thousands of async operations and you can't
 * just invoke them all at once because of resource constraints (e.g. network bandwidth).
 *
 * 'operationParams' should be an array of parameters for each async operation. The size of this array coresponds
 * to the amount of async operations that will be invoked.
 * 'operationPromiseGenerator' will be invoked sequentially with each params of 'operationParams' and with it
 * you can specify what the actual async operation should be
 *
 * TODO: Some tests would be nice, although it does work when tested through `yarn cli download commit` in speckle-server
 */
export async function batchAsyncOperations<Params = unknown, Res = unknown>(
  name: string,
  operationParams: Params[],
  operationPromiseGenerator: (params: Params) => Promise<Res>,
  options?: Partial<{
    /**
     * If promise returned by generator fails, re-execute it this many times
     */
    retryCount: number
    /**
     * How many concurrent promises can be executed at once
     */
    batchSize: number

    /**
     * Optionally override the logger with a custom one
     */
    logger: (...args: unknown[]) => void

    /**
     * If set to true, the function won't collect all of the returns of each operation in an effort to reduce
     * memory usage. The function will return 'true' instead of an array of results.
     */
    dropReturns: boolean
  }>
) {
  const {
    retryCount = 3,
    batchSize = 100,
    dropReturns = false,
    logger = (...args: unknown[]) => console.log(...args)
  } = options || {}

  const finalLogger = (message: string, ...args: unknown[]) =>
    logger(`[${name}] ${message}`, ...args)

  finalLogger('Starting batched operation...')

  const operationCount = operationParams.length
  let allResults: Res[] = []

  let executedOperationCount = 0
  const batchCount = Math.ceil(operationCount / batchSize)
  for (let i = 0; i < batchCount; i++) {
    finalLogger(`Processing batch ${i + 1} out of ${batchCount}...`)

    // Figure out how many operations we can execute in this batch
    const newExecutedOperationCount = Math.min(
      executedOperationCount + batchSize,
      operationCount
    )
    const operationsToExecuteCount = newExecutedOperationCount - executedOperationCount
    if (operationsToExecuteCount <= 0) return

    // Invoke operation generator
    const batchParams = operationParams.slice(
      executedOperationCount,
      newExecutedOperationCount
    )
    const batchRequests: Promise<Res>[] = []

    let currentOperationIdx = executedOperationCount
    for (const params of batchParams) {
      const currentOperationNumber = currentOperationIdx + 1
      const label = `${currentOperationNumber}/${operationCount}`

      const operationPromise = (async () => {
        finalLogger(`Queuing operation ${label}...`)

        const execute = () => operationPromiseGenerator(params)
        let promise = execute().then((res) => {
          finalLogger(`...finished operation ${label}`)
          return res
        })

        // Attach retries
        range(retryCount).forEach((retry) => {
          promise = promise.catch((e) => {
            finalLogger(
              `...failure in operation ${label}: "${e}". Triggering retry ${
                retry + 1
              }...`
            )
            return execute()
          })
        })
        promise = promise.catch((e) => {
          finalLogger(`...final failure in operation ${label}!`)
          throw e
        })

        return promise
      })()

      batchRequests.push(operationPromise)
      currentOperationIdx++
    }

    const batchResults = await Promise.all(batchRequests)

    if (!dropReturns) {
      allResults = allResults.concat(batchResults)
    }

    executedOperationCount = newExecutedOperationCount
  }

  return dropReturns ? true : allResults
}

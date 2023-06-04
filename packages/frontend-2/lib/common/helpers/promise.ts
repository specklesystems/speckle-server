export class UninitializedControllablePromiseError extends Error {}

/**
 * Create promise that you can reject/resolve outside of the promise's definition
 */
export function createControllablePromise<T>() {
  let resolve: Parameters<Promise<T>['then']>[0]
  let reject: Parameters<Promise<T>['catch']>[0]

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  // wrappers to get around resolve/reject possibly not being set before returning
  const resolveWrapper: NonNullable<typeof resolve> = (...args) => {
    if (!resolve) {
      throw new UninitializedControllablePromiseError('Promise not yet initialized')
    }

    resolve(...args)
  }
  const rejectWrapper: NonNullable<typeof reject> = (...args) => {
    if (!reject) {
      throw new UninitializedControllablePromiseError('Promise not yet initialized')
    }

    reject(...args)
  }

  return {
    promise,
    resolve: resolveWrapper,
    reject: rejectWrapper
  }
}

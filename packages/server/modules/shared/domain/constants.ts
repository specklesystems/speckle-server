import { StringEnum } from '@speckle/shared'

export const PromiseAllSettledResultStatus = StringEnum(['rejected', 'fulfilled'])

export const wasRejected = <T>(
  result: PromiseSettledResult<T>
): result is PromiseRejectedResult =>
  result.status === PromiseAllSettledResultStatus.rejected

import { WorkStatus, WorkToBeDone } from '@/domain/backgroundWorker.js'
import { throwUncoveredError } from '@speckle/shared/dist/esm/index.js'

let shouldExit = false

export function forceExit() {
  shouldExit = true
}

type RepeatedlyDoSomeWork = () => void
export const repeatedlyDoSomeWorkFactory =
  (deps: {
    doSomeWork: WorkToBeDone
    onExit: () => void
    delayPeriods: {
      onSuccess: number
      onNoWorkFound: number
      onFailed: number
    }
  }): RepeatedlyDoSomeWork =>
  async () => {
    if (shouldExit) {
      deps.onExit()
      return
    }

    const status = await deps.doSomeWork()
    switch (status) {
      case WorkStatus.SUCCESS:
        setTimeout(repeatedlyDoSomeWorkFactory(deps), deps.delayPeriods.onSuccess)
        break
      case WorkStatus.NOWORKFOUND:
        setTimeout(repeatedlyDoSomeWorkFactory(deps), deps.delayPeriods.onNoWorkFound)
        break
      case WorkStatus.FAILED:
        setTimeout(repeatedlyDoSomeWorkFactory(deps), deps.delayPeriods.onFailed)
        break
      default:
        throwUncoveredError(status)
    }
  }

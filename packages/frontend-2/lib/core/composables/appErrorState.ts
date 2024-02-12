import { useScopedState } from '~~/lib/common/composables/scopedState'
import { Observability } from '@speckle/shared'

const ENTER_STATE_AT_ERRORS_PER_MIN = 100

export function useAppErrorState() {
  const state = useScopedState('appErrorState', () => ({
    inErrorState: ref(false),
    errorRpm: Observability.simpleRpmCounter()
  }))
  const logger = useLogger()

  return {
    isErrorState: computed(() => state.inErrorState.value),
    registerError: () => {
      const epm = state.errorRpm.hit()

      if (!state.inErrorState.value && epm >= ENTER_STATE_AT_ERRORS_PER_MIN) {
        logger.fatal(
          `Too many errors (${epm} errors per minute), entering app error state!`
        )
        state.inErrorState.value = true
      }
    }
  }
}

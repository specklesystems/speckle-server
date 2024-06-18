import * as Observability from '@speckle/shared/dist/esm/observability/index'
import Vue from 'vue'

const ENTER_STATE_AT_ERRORS_PER_MIN = 100

const state = Vue.observable({
  inErrorState: false
})

const errorRpm = Observability.simpleRpmCounter()

export function isErrorState() {
  return !!state.inErrorState
}

export function registerError() {
  const epm = errorRpm.hit()

  if (!isErrorState() && epm >= ENTER_STATE_AT_ERRORS_PER_MIN) {
    console.error(
      `Too many errors (${epm} errors per minute), entering app error state!`
    )
    state.inErrorState = true
  }
}

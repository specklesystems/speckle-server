<template>
  <div />
</template>
<script setup lang="ts">
import { isFunction } from 'lodash-es'
import { useQueuedRoutingState } from '~~/lib/common/composables/url'

/**
 * Singleton component that actually processes the queued routing calls
 */

const { queuedCalls, processingPromise } = useQueuedRoutingState()
const router = useRouter()
const route = useRoute()

const processNextCall = async () => {
  if (!queuedCalls.value.length) {
    processingPromise.value = null
    return
  }

  // take 1st call and invoke it
  const pushCall = queuedCalls.value[0]

  try {
    const to = pushCall.args[0]
    const toFinal = isFunction(to) ? to(route) : to

    const result = await router.push(toFinal)
    pushCall.res.resolve(result)
  } catch (e) {
    pushCall.res.reject(e)
  }

  // updated queuedCalls, which should re-trigger the watcher
  queuedCalls.value = queuedCalls.value.slice(1)

  // do another cycle or quit if nothing else to process
  if (queuedCalls.value.length) {
    startProcessing()
  } else {
    processingPromise.value = null
  }
}

const startProcessing = () => {
  processingPromise.value = new Promise((resolve) => {
    // wait 1 tick so that processingPromise is already assigned before we actually start processing
    setImmediate(() => resolve(processNextCall()))
  })
}

watch(
  () => queuedCalls.value,
  () => {
    // if already in a processing loop, return
    if (processingPromise.value) {
      return
    }

    startProcessing()
  }
)
</script>

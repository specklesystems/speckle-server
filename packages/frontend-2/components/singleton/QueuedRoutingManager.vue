<template>
  <div />
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { isFunction, set } from 'lodash-es'
import { nanoid } from 'nanoid'
import { useQueuedRoutingState } from '~~/lib/common/composables/url'

/**
 * Singleton component that actually processes the queued routing calls
 */

const { queuedCalls } = useQueuedRoutingState()
const router = useRouter()
const route = useRoute()

let processingPromise = null as Nullable<Promise<unknown>>

const processNextCall = async () => {
  const id = nanoid()
  console.log(`[${id}] start processNextCall()`, processingPromise)

  if (!queuedCalls.value.length) {
    processingPromise = null
    console.log(`[${id}] quit processNextCall() early`, processingPromise)
    return
  }

  // take 1st call and invoke it
  const pushCall = queuedCalls.value[0]

  try {
    const to = pushCall.args[0]
    const toFinal = isFunction(to) ? to(route) : to
    console.log(`[${id}] processNextCall() invoking w/`, toFinal, processingPromise)

    const result = await router.push(toFinal)
    pushCall.res.resolve(result)
  } catch (e) {
    pushCall.res.reject(e)
  }

  // updated queuedCalls, which should re-trigger the watcher
  queuedCalls.value = queuedCalls.value.slice(1)

  console.log(`[${id}] quit processNextCall()`, processingPromise)
  if (queuedCalls.value.length) {
    startProcessing()
  } else {
    processingPromise = null
  }
}

const startProcessing = () => {
  const id = nanoid()
  processingPromise = new Promise((resolve) => {
    // wait 1 tick so that processingPromise is already assigned before we actually start processing
    setImmediate(() => resolve(processNextCall()))
  })
  set(processingPromise, 'idd', id)
  console.log('new processing triggered - ' + id)
}

watch(
  () => queuedCalls.value,
  (newVal) => {
    const id = nanoid()

    console.log(`[${id}] watch start`, newVal, processingPromise)

    // if already in a processing loop, return
    if (processingPromise) {
      console.log(`[${id}] watch early return`, newVal, processingPromise)

      return
    }

    console.log(`[${id}] watch processing`, newVal, processingPromise)
    startProcessing()
  }
)
</script>

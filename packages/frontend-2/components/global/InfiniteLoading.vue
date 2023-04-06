<template>
  <div ref="wrapper">
    <InternalInfiniteLoading
      v-if="initializeLoader"
      v-bind="$props.settings || {}"
      @infinite="$emit('infinite', $event)"
    >
      <template #spinner>
        <CommonLoadingBar :loading="true" class="my-2" />
      </template>
      <template #complete>
        <div class="w-full flex flex-col items-center my-2 space-y-2 mt-4">
          <div class="inline-flex items-center space-x-1">
            <CheckIcon class="w-5 h-5 text-success" />
            <span class="text-foreground-2">That's it, you've loaded everything!</span>
          </div>
        </div>
      </template>
      <template #error="{ retry }">
        <div class="w-full flex flex-col items-center my-2 space-y-2 mt-4">
          <div class="inline-flex items-center space-x-1">
            <ExclamationTriangleIcon class="w-5 h-5 text-danger" />
            <span class="text-foreground-2">An error occurred while loading</span>
          </div>
          <FormButton v-if="allowRetry" @click="retry">Retry</FormButton>
        </div>
      </template>
    </InternalInfiniteLoading>
  </div>
</template>
<script setup lang="ts">
import InternalInfiniteLoading from 'v3-infinite-loading'
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'
import { Nullable } from '@speckle/shared'

defineEmits<{
  (e: 'infinite', $state: InfiniteLoaderState): void
}>()

defineProps<{
  /**
   * v3-infinite-loading props, see docs or type definitions
   */
  settings?: {
    target?: string
    distance?: number
    top?: boolean
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    identifier?: any
    firstload?: boolean
  }
  allowRetry?: boolean
}>()

const wrapper = ref(null as Nullable<HTMLElement>)
const initializeLoader = ref(false)

// This hack is necessary cause sometimes v3-infinite-loading initializes too early and doesnt trigger
if (process.client) {
  onMounted(() => {
    const int = setInterval(() => {
      if (wrapper.value?.isConnected) {
        initializeLoader.value = true
        clearInterval(int)
      }
    }, 200)
  })
}
</script>

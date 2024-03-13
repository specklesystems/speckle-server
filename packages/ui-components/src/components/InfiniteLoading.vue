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
        <!-- No "No more items" message, instead a small amount of spacing -->
        <div class="h-8"></div>
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
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import type { InfiniteLoaderState } from '~~/src/helpers/global/components'
import type { Nullable } from '@speckle/shared'
import CommonLoadingBar from '~~/src/components/common/loading/Bar.vue'
import { onMounted, ref } from 'vue'
import { isClient } from '@vueuse/core'
import FormButton from '~~/src/components/form/Button.vue'

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
  /**
   * Whether to allow retry and show a retry button when loading fails
   */
  allowRetry?: boolean
}>()

const wrapper = ref(null as Nullable<HTMLElement>)
const initializeLoader = ref(false)

// This hack is necessary cause sometimes v3-infinite-loading initializes too early and doesnt trigger
if (isClient) {
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

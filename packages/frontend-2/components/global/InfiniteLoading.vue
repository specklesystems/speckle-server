<template>
  <InternalInfiniteLoading
    v-bind="$props.settings || {}"
    @infinite="$emit('infinite', $event)"
  >
    <template #spinner>
      <CommonLoadingBar :loading="true" class="my-2" />
    </template>
    <template #complete>
      <div class="w-full flex flex-col items-center my-2 space-y-2">
        <div class="inline-flex items-center space-x-1">
          <CheckIcon class="w-5 h-5 text-success" />
          <span class="text-foreground-2">That's it, you've loaded everything!</span>
        </div>
      </div>
    </template>
    <template #error="{ retry }">
      <div class="w-full flex flex-col items-center my-2 space-y-2">
        <div class="inline-flex items-center space-x-1">
          <ExclamationTriangleIcon class="w-5 h-5 text-danger" />
          <span class="text-foreground-2">An error occurred while loading</span>
        </div>
        <FormButton v-if="allowRetry" @click="retry">Retry</FormButton>
      </div>
    </template>
  </InternalInfiniteLoading>
</template>
<script setup lang="ts">
import InternalInfiniteLoading from 'v3-infinite-loading'
import { ExclamationTriangleIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { InfiniteLoaderState } from '~~/lib/global/helpers/components'

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
</script>

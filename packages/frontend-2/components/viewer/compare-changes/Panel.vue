<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
      <FormButton
        size="xs"
        text
        :icon-left="ChevronLeftIcon"
        @click="endDiff()"
      >
        Back
      </FormButton> 
    </template>
    <div class="flex flex-col space-y-2 text-sm p-2">
      <div class="text-xs bg-blue-500/20 text-primary p-1 rounded">
        This is an experimental feature.
      </div>
      <div class="flex space-x-2">
        <div class="flex items-center justify-center h-20 grow bg-foundation-2 shadow rounded-md">A</div>
        <div class="flex items-center justify-center h-20 grow bg-foundation-2 shadow rounded-md">B</div>
      </div>
      <div class="grow">
        <!-- New -->
        <input
          id="intensity"
          v-model="localDiffTime"
          class="h-2 w-full"
          type="range"
          name="intensity"
          min="0"
          max="1"
          step="0.01"
        />
        <!-- Old -->
      </div>
      <div>added: {{ diffState.diffResult.value?.added.length }}</div>
      <div>removed: {{ diffState.diffResult.value?.removed.length }}</div>
      <div>modified: {{ diffState.diffResult.value?.modified.length }}</div>
      <div>unchanged: {{ diffState.diffResult.value?.unchanged.length}}</div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { DiffResult } from '@speckle/viewer'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'
import { useDiffing } from '~~/lib/viewer/composables/viewer'

const { diff: diffState } = useInjectedViewerInterfaceState()
const { diff, endDiff } = useDiffing()
const { instance } = useInjectedViewer()

const localDiffTime = ref(0.5)

watch(localDiffTime, (newVal) => {
  instance.setDiffTime(diffState.diffResult.value as DiffResult, newVal)
})

watch(diffState, () => {
  localDiffTime.value = 0.5
})
</script>
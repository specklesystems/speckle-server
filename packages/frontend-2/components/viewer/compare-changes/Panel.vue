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
          id="diffTime"
          v-model="localDiffTime"
          class="h-2 w-full"
          type="range"
          name="diffTime"
          min="0"
          max="1"
          step="0.01"
        />
        <!-- TODO: add colour toggling button -->
        <!-- Old -->
      </div>
      <div>unchanged: {{ unchanged.length}}</div>
      <div>added: {{ added.length }}</div>
      <div>removed: {{ removed.length }}</div>
      <div>modified: {{ modified.length }}</div>
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
import { uniqBy } from 'lodash-es'

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

const added = computed(() => {
  const mapped = diffState.diffResult.value?.added.map( node => node.model.raw )
  return uniqBy(mapped, (node => node.id))
})
const removed = computed(() => {
  const mapped = diffState.diffResult.value?.removed.map( node => node.model.raw )
  return uniqBy(mapped, (node => node.id))
})
const unchanged = computed(() => {
  const mapped = diffState.diffResult.value?.unchanged.map( node => node.model.raw )
  return uniqBy(mapped, (node => node.id))
})

const modified = computed(() => {
  const mapped = diffState.diffResult.value?.modified.map( tuple => { return [tuple[0].model.raw, tuple[1].model.raw] }  )
  return uniqBy(mapped, (tuple => tuple[0].id))
})

</script>
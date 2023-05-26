<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
      <FormButton size="xs" text :icon-left="ChevronLeftIcon" @click="endDiff()">
        Back
      </FormButton>
    </template>
    <div class="flex flex-col space-y-2 text-sm p-2">
      <div class="text-xs bg-blue-500/20 text-primary p-1 rounded">
        This is an experimental feature.
      </div>
      <div class="flex space-x-2">
        <div
          class="flex items-center justify-center h-20 grow bg-foundation-2 shadow rounded-md"
        >
          A
        </div>
        <div
          class="flex items-center justify-center h-20 grow bg-foundation-2 shadow rounded-md"
        >
          B
        </div>
      </div>
      <div class="grow flex items-center space-x-2">
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
        <FormButton v-tippy="'Toggle coloring'" size="xs" text @click="swapDiffMode()">
          <SparklesIconOutline
            v-if="diffState.diffMode.value !== VisualDiffMode.COLORED"
            class="w-3 h-3 text-primary"
          />
          <SparklesIcon v-else class="w-3 h-3 text-primary" />
        </FormButton>
        <!-- TODO: add colour toggling button -->
        <!-- Old -->
      </div>
      <ViewerCompareChangesObjectGroup name="unchanged" :objectIds="unchangedIds" />
      <ViewerCompareChangesObjectGroup name="added" :objectIds="addedIds" />
      <ViewerCompareChangesObjectGroup name="removed" :objectIds="removedIds" />
      <ViewerCompareChangesObjectGroup name="modified" :objectIds="modifiedIds" />
      <!-- <div>unchanged: {{ unchanged.length }}</div>
      <div>added: {{ added.length }}</div>
      <div>removed: {{ removed.length }}</div>
      <div>modified: {{ modified.length }}</div> -->
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronLeftIcon, SparklesIcon } from '@heroicons/vue/24/solid'
import { SparklesIcon as SparklesIconOutline } from '@heroicons/vue/24/outline'

import { DiffResult, VisualDiffMode } from '@speckle/viewer'
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

const colors = ref(true)

watch(localDiffTime, (newVal) => {
  instance.setDiffTime(diffState.diffResult.value as DiffResult, newVal)
})

watch(diffState, () => {
  localDiffTime.value = 0.5
})

function swapDiffMode() {
  if (diffState.diffMode.value === VisualDiffMode.COLORED)
    return (diffState.diffMode.value = VisualDiffMode.PLAIN)
  diffState.diffMode.value = VisualDiffMode.COLORED
}

// NOTE: deduping will not be needed anymore
const added = computed(() => {
  const mapped = diffState.diffResult.value?.added.map((node) => node.model.raw)
  return uniqBy(mapped, (node) => node.id)
})
const addedIds = computed(() => added.value.map((o) => o.id as string))

const removed = computed(() => {
  const mapped = diffState.diffResult.value?.removed.map((node) => node.model.raw)
  return uniqBy(mapped, (node) => node.id)
})
const removedIds = computed(() => removed.value.map((o) => o.id as string))

const unchanged = computed(() => {
  const mapped = diffState.diffResult.value?.unchanged.map((node) => node.model.raw)
  return uniqBy(mapped, (node) => node.id)
})
const unchangedIds = computed(() => unchanged.value.map((o) => o.id as string))
const modified = computed(() => {
  const mapped = diffState.diffResult.value?.modified.map((tuple) => {
    return [tuple[0].model.raw, tuple[1].model.raw]
  })
  return uniqBy(mapped, (tuple) => tuple[0].id)
})
const modifiedIds = computed(() => {
  return [...modified.value.map((t) => t[0]), modified.value.map((t) => t[1])]
})
</script>

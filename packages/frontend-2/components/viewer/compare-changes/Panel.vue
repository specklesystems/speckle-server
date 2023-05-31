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
        <div class="grow w-1/2">
          <ViewerCompareChangesVersion
            v-if="newVersion"
            :version="newVersion"
            :is-newest="true"
            @click="localDiffTime = 0"
          />
        </div>
        <div class="grow w-1/2">
          <ViewerCompareChangesVersion
            v-if="oldVersion"
            :version="oldVersion"
            :is-newest="false"
            @click="localDiffTime = 1"
          />
        </div>
      </div>
      <div class="grow flex items-center space-x-2 py-2">
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
      </div>
      <div class="flex items-center justify-between w-full px-1">
        <span class="text-xs text-left">Color objects by status</span>
        <FormButton
          size="xs"
          :outlined="diffState.diffMode.value !== VisualDiffMode.COLORED"
          @click="swapDiffMode()"
        >
          {{ diffState.diffMode.value === VisualDiffMode.COLORED ? 'ON' : 'OFF' }}
        </FormButton>
      </div>
      <!-- <div class="ml-1">Change summary:</div> -->
      <div class="grid grid-cols-2 gap-2">
        <ViewerCompareChangesObjectGroup name="unchanged" :objectIds="unchangedIds" />
        <ViewerCompareChangesObjectGroup name="modified" :objectIds="modifiedIds" />
        <ViewerCompareChangesObjectGroup name="added" :objectIds="addedIds" />
        <ViewerCompareChangesObjectGroup name="removed" :objectIds="removedIds" />
      </div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'

import { VisualDiffMode } from '@speckle/viewer'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerLoadedResources
} from '~~/lib/viewer/composables/setup'
import { useDiffing } from '~~/lib/viewer/composables/viewer'
import { uniqBy } from 'lodash-es'

const { diff: diffState } = useInjectedViewerInterfaceState()
const { endDiff } = useDiffing()

const { modelsAndVersionIds } = useInjectedViewerLoadedResources()

const versions = computed(() => {
  if (modelsAndVersionIds.value.length <= 0) return
  return [...modelsAndVersionIds.value[0].model.loadedVersion.items].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
})
const oldVersion = computed(() => (versions.value ? versions.value[0] : undefined))
const newVersion = computed(() => (versions.value ? versions.value[1] : undefined))

const localDiffTime = ref(diffState.diffTime.value)

watch(
  localDiffTime,
  (newVal) => {
    diffState.diffTime.value = newVal
  },
  { immediate: true }
)

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
  return [
    ...modified.value.map((t) => t[0].id as string),
    ...modified.value.map((t) => t[1].id as string)
  ]
})
</script>

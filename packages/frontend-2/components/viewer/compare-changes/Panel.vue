<template>
  <ViewerLayoutPanel @close="$emit('close')">
    <template #actions>
      <FormButton size="xs" text :icon-left="ChevronLeftIcon" @click="clearDiff">
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
            v-if="diffState.newVersion.value"
            :version="diffState.newVersion.value"
            :is-newest="true"
            @click="localDiffTime = 0"
          />
        </div>
        <div class="grow w-1/2">
          <ViewerCompareChangesVersion
            v-if="diffState.oldVersion.value"
            :version="diffState.oldVersion.value"
            :is-newest="false"
            @click="localDiffTime = 1"
          />
        </div>
      </div>
      <div class="grow flex items-center space-x-2 py-2">
        <label for="diffTime" class="sr-only">Diff Time</label>
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
          :outlined="diffState.mode.value !== VisualDiffMode.COLORED"
          @click="swapDiffMode()"
        >
          {{ diffState.mode.value === VisualDiffMode.COLORED ? 'ON' : 'OFF' }}
        </FormButton>
      </div>
      <!-- <div class="ml-1">Change summary:</div> -->
      <div class="grid grid-cols-2 gap-2">
        <ViewerCompareChangesObjectGroup name="unchanged" :object-ids="unchangedIds" />
        <ViewerCompareChangesObjectGroup name="modified" :object-ids="modifiedIds" />
        <ViewerCompareChangesObjectGroup name="added" :object-ids="addedIds" />
        <ViewerCompareChangesObjectGroup name="removed" :object-ids="removedIds" />
      </div>
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { VisualDiffMode } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { uniqBy } from 'lodash-es'
import { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'

defineEmits<{
  (e: 'close'): void
}>()

const {
  ui: { diff: diffState },
  urlHashState: { diff }
} = useInjectedViewerState()

const localDiffTime = ref(diffState.time.value)

watch(
  localDiffTime,
  (newVal) => {
    diffState.time.value = newVal
  },
  { immediate: false }
)

watch(diffState.result, () => {
  localDiffTime.value = 0.5
})

function swapDiffMode() {
  if (diffState.mode.value === VisualDiffMode.COLORED)
    return (diffState.mode.value = VisualDiffMode.PLAIN)

  diffState.mode.value = VisualDiffMode.COLORED
}

// NOTE: deduping will not be needed anymore
const added = computed(() => {
  const mapped = diffState.result.value?.added.map(
    (node) => node.model.raw as SpeckleObject
  )
  return uniqBy(mapped, (node) => node.id)
})
const addedIds = computed(() => added.value.map((o) => o.id as string))

const removed = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const mapped = diffState.result.value?.removed.map(
    (node) => node.model.raw as SpeckleObject
  )
  return uniqBy(mapped, (node) => node.id)
})
const removedIds = computed(() => removed.value.map((o) => o.id as string))

const unchanged = computed(() => {
  const mapped = diffState.result.value?.unchanged.map(
    (node) => node.model.raw as SpeckleObject
  )
  return uniqBy(mapped, (node) => node.id)
})
const unchangedIds = computed(() => unchanged.value.map((o) => o.id as string))
const modified = computed(() => {
  const mapped = diffState.result.value?.modified.map((tuple) => {
    return [tuple[0].model.raw as SpeckleObject, tuple[1].model.raw as SpeckleObject]
  })
  return uniqBy(mapped, (tuple) => tuple[0].id)
})
const modifiedIds = computed(() => {
  return [
    ...modified.value.map((t) => t[0].id as string),
    ...modified.value.map((t) => t[1].id as string)
  ]
})

const clearDiff = async () => {
  await diff.update(null)
}
</script>

<template>
  <ViewerLayoutSidePanel>
    <template #title>
      <div class="flex items-center gap-1">
        <FormButton
          color="subtle"
          :icon-left="ChevronLeftIcon"
          hide-text
          size="sm"
          @click="handleBack"
        >
          Go back
        </FormButton>
        Go back
      </div>
    </template>
    <div class="flex flex-col text-sm p-2">
      <div
        class="text-body-2xs bg-foundation-2 text-foreground p-1 rounded mb-2 text-center"
      >
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
      <div class="border-y border-outline-3 py-3 mt-4">
        <FormRange
          v-model="localDiffTime"
          label="Diff time"
          hide-header
          :min="0"
          :max="1"
          :step="0.01"
          name="diffTime"
        />
      </div>
      <div
        class="flex items-center justify-between w-full px-1 border-b border-outline-3 py-3 mb-4"
      >
        <span class="text-body-2xs text-left">Color objects by status</span>
        <FormSwitch
          :model-value="isColoredModeEnabled"
          :show-label="false"
          name="color-objects-by-status"
          @update:model-value="swapDiffMode"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <ViewerCompareChangesObjectGroup name="unchanged" :object-ids="unchangedIds" />
        <ViewerCompareChangesObjectGroup name="modified" :object-ids="modifiedIds" />
        <ViewerCompareChangesObjectGroup name="added" :object-ids="addedIds" />
        <ViewerCompareChangesObjectGroup name="removed" :object-ids="removedIds" />
      </div>
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { ChevronLeftIcon } from '@heroicons/vue/24/solid'
import { VisualDiffMode } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { uniqBy, debounce } from 'lodash-es'
import type { SpeckleObject } from '~~/lib/viewer/helpers/sceneExplorer'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { TIME_MS } from '@speckle/shared'
import { FormSwitch } from '@speckle/ui-components'

const props = withDefaults(
  defineProps<{
    clearOnBack?: boolean
  }>(),
  {
    clearOnBack: true
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const {
  ui: { diff: diffState },
  urlHashState: { diff }
} = useInjectedViewerState()

const localDiffTime = ref(diffState.time.value)

const isColoredModeEnabled = computed(() => {
  return diffState.mode.value === VisualDiffMode.COLORED
})

watch(
  localDiffTime,
  (newVal) => {
    diffState.time.value = newVal
    debouncedTrackChangeDiffTime()
  },
  { immediate: false }
)

const debouncedTrackChangeDiffTime = debounce(() => {
  mp.track('Viewer Action', {
    type: 'action',
    name: 'diffs',
    action: 'set-diff-time',
    value: localDiffTime.value
  })
}, TIME_MS.second)

watch(diffState.result, () => {
  localDiffTime.value = 0.5
  if (diffState.result.value) {
    mp.track('Viewer Action', {
      type: 'stats',
      name: 'diffs',
      size: {
        changed: diffState.result.value.modified.length,
        removed: diffState.result.value.removed.length,
        added: diffState.result.value.added.length,
        unchanged: diffState.result.value.unchanged.length
      }
    })
  }
})

function swapDiffMode() {
  if (diffState.mode.value === VisualDiffMode.COLORED) {
    diffState.mode.value = VisualDiffMode.PLAIN
    mp.track('Viewer Action', {
      type: 'action',
      name: 'diffs',
      action: 'set-mode-plain'
    })
    return
  }
  mp.track('Viewer Action', {
    type: 'action',
    name: 'diffs',
    action: 'set-mode-colored'
  })
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

const mp = useMixpanel()

const handleBack = async () => {
  if (props.clearOnBack) {
    mp.track('Viewer Action', {
      type: 'action',
      name: 'diffs',
      action: 'disable'
    })
    await diff.update(null)
  } else {
    emit('close')
  }
}
</script>

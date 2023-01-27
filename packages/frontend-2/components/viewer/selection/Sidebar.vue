<template>
  <div
    :class="`fixed max-h-[calc(100vh-5.5rem)] top-[4.5rem] w-80 px-2 py-1 right-4 rounded-md shadow mb-4 transition bg-foundation overflow-y-auto simple-scrollbar ${
      objects.length !== 0
        ? 'translate-x-0 opacity-100'
        : 'translate-x-[120%] opacity-0'
    }`"
  >
    <div class="mb-2">
      <div class="text-tiny text-foreground-2">
        {{ allTargetIds }}
        <hr />
        isolated: {{ isIsolated }} / hidden: {{ isHidden }}
      </div>
      <div class="flex items-center">
        <div class="font-bold text-xs flex items-center space-x-1">
          <CubeIcon class="w-3 h-3" />
          <span>{{ objects.length }}</span>
        </div>
        <FormButton size="xs" :icon-right="EyeIcon" text @click="hideOrShowSelection()">
          &nbsp;
        </FormButton>
        <FormButton size="xs" :icon-right="FunnelIcon" text @click="clearSelection()">
          &nbsp;
        </FormButton>
        <FormButton
          size="xs"
          :icon-right="ArrowTopRightOnSquareIcon"
          text
          title="open selection in new tab"
          @click="clearSelection()"
        >
          &nbsp;
        </FormButton>
        <FormButton size="xs" :icon-right="XMarkIcon" text @click="clearSelection()">
          &nbsp;
        </FormButton>
      </div>
    </div>
    <div class="w-full my-2 border-b border-outline-3"></div>

    <div>
      <div v-for="object in objects" :key="(object.id as string)">
        <ViewerSelectionObject :object="object" :unfold="unfold" />
        <div class="w-full my-2 border-b border-outline-3"></div>
      </div>
    </div>
    <div v-if="objects.length === 1" class="text-xs text-foreground-2 mt-2">
      Hold down "shift" to select multiple objects.
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  FunnelIcon,
  CubeIcon
} from '@heroicons/vue/24/solid'
import { onKeyStroke } from '@vueuse/core'
import {
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'

const {
  ui: {
    selection: { objects, clearSelection },
    filters
  },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

const unfold = computed(() => objects.value.length === 1)

const containsAll = (target: unknown[], array: unknown[]) =>
  target.every((v) => array.includes(v))

const hiddenObjects = computed(() => filters.current.value?.hiddenObjects)
const isolatedObjects = computed(() => filters.current.value?.isolatedObjects)

const allTargetIds = computed(() => {
  const ids = []
  for (const obj of objects.value) {
    ids.push(...getTargetObjectIds(obj))
  }

  return ids
})

const isHidden = computed(() => {
  if (!hiddenObjects.value) return false
  return containsAll(allTargetIds.value, hiddenObjects.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjects.value) return false
  return containsAll(allTargetIds.value, isolatedObjects.value)
})

const stateKey = 'object-selection'

const hideOrShowSelection = () => {
  if (!isHidden.value) {
    viewerInstance.selectObjects([]) // bypassing the FE state, and resetting the viewer selection state only
    filters.hideObjects(allTargetIds.value, stateKey, true)
    return
  }
  return filters.showObjects(allTargetIds.value, stateKey, true)
}

onKeyStroke('Escape', () => {
  // Cleareance of any vis/iso state coming from here should happen in clearSelection()
  clearSelection()
})
</script>

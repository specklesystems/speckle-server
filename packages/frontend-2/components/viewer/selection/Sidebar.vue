<template>
  <div
    :class="`bg-foundation simple-scrollbar fixed top-[4.5rem] right-4 mb-4 max-h-[calc(100vh-5.5rem)] w-64 overflow-y-auto rounded-md shadow transition ${
      objects.length !== 0
        ? 'translate-x-0 opacity-100'
        : 'translate-x-[120%] opacity-0'
    }`"
  >
    <div
      class="bg-foundation-2 sticky top-0 mb-2 flex h-10 items-center justify-start rounded-t-lg px-2 shadow-md"
    >
      <div class="flex w-full items-center justify-between space-x-2">
        <div>
          <button
            class="hover:text-primary px-1 py-2 transition"
            @click.stop="hideOrShowSelection"
          >
            <EyeIcon v-if="!isHidden" class="h-3 w-3" />
            <EyeSlashIcon v-else class="h-3 w-3" />
          </button>

          <button
            class="hover:text-primary px-1 py-2 transition"
            @click.stop="isolateOrUnisolateSelection"
          >
            <FunnelIconOutline v-if="!isIsolated" class="h-3 w-3" />
            <FunnelIcon v-else class="h-3 w-3" />
          </button>
          <!-- <button
          class="px-1 py-2 hover:text-primary transition"
          title="Open selection in a new tab"
          @click.stop="clearSelection()"
        >
          <ArrowTopRightOnSquareIcon class="w-3 h-3" />
        </button> -->
        </div>
        <button
          v-tippy="'Clear selection'"
          class="hover:text-primary px-1 py-2 transition"
          @click.stop="clearSelection()"
        >
          <XMarkIcon class="h-3 w-3" />
        </button>
      </div>
    </div>

    <div class="px-1 py-2">
      <div class="space-y-2">
        <div v-for="object in objects" :key="(object.id as string)">
          <ViewerSelectionObject :object="object" :unfold="false" />
          <!-- <div class="border-outline-3 my-2 w-full border-b"></div> -->
        </div>
      </div>
      <div v-if="objects.length === 1" class="text-foreground-2 mt-2 px-2 text-xs">
        Hold down "shift" to select multiple objects.
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  CubeIcon
} from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'

import { onKeyStroke } from '@vueuse/core'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { getTargetObjectIds } from '~~/lib/object-sidebar/helpers'
import { containsAll } from '~~/lib/common/helpers/utils'
import { ViewerSceneExplorerStateKey } from '~~/lib/common/helpers/constants'

const {
  ui: {
    selection: { objects, clearSelection },
    filters
  },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

// const unfold = computed(() => objects.value.length === 1)

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

const stateKey = ViewerSceneExplorerStateKey

const hideOrShowSelection = () => {
  if (!isHidden.value) {
    // viewerInstance.selectObjects([]) // bypassing the FE state, and resetting the viewer selection state only
    filters.hideObjects(allTargetIds.value, stateKey, true)
    clearSelection() // when hiding, the objects disappear. they can't really stay "selected"
    return
  }
  return filters.showObjects(allTargetIds.value, stateKey, true)
}

const isolateOrUnisolateSelection = () => {
  if (!isIsolated.value) {
    viewerInstance.selectObjects([]) // bypassing the FE state, and resetting the viewer selection state only
    filters.isolateObjects(allTargetIds.value, stateKey, true)
    return
  }
  return filters.unIsolateObjects(allTargetIds.value, stateKey, true)
}

onKeyStroke('Escape', () => {
  // Cleareance of any vis/iso state coming from here should happen in clearSelection()
  clearSelection()
})
</script>

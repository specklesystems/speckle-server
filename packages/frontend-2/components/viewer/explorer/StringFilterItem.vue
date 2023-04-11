<template>
  <div
    class="flex group justify-between items-center w-full max-w-full overflow-hidden select-none space-x-2"
  >
    <div class="flex space-x-2 items-center flex-shrink truncate">
      <span class="truncate">{{ item.value }}</span>
      <span class="text-xs text-foreground-2">({{ item.ids.length }})</span>
    </div>
    <!-- <div class="flex-grow"></div> -->
    <div class="flex items-center flex-shrink-0">
      <button
        :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
          isHidden ? 'opacity-100' : ''
        }`"
        @click.stop="hideOrShowObject"
      >
        <EyeIcon v-if="!isHidden" class="h-3 w-3" />
        <EyeSlashIcon v-else class="h-3 w-3" />
      </button>
      <button
        :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
          isIsolated ? 'opacity-100' : ''
        }`"
        @click.stop="isolateOrUnisolateObject"
      >
        <FunnelIconOutline v-if="!isIsolated" class="h-3 w-3" />
        <FunnelIcon v-else class="h-3 w-3" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { EyeIcon, EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'

import { containsAll } from '~~/lib/common/helpers/utils'
import { useInjectedViewerInterfaceState } from '~~/lib/viewer/composables/setup'
import { ViewerSceneExplorerStateKey } from '~~/lib/common/helpers/constants'

const props = defineProps<{
  item: {
    value: string
    ids: string[]
  }
}>()

const { filters } = useInjectedViewerInterfaceState()

const hiddenObjects = computed(() => filters.current.value?.hiddenObjects)
const isolatedObjects = computed(() => filters.current.value?.isolatedObjects)

const isHidden = computed(() => {
  if (!hiddenObjects.value) return false
  const ids = props.item.ids
  return containsAll(ids, hiddenObjects.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjects.value) return false
  const ids = props.item.ids
  return containsAll(ids, isolatedObjects.value)
})

const stateKey = ViewerSceneExplorerStateKey
const hideOrShowObject = () => {
  // const ids = getTargetObjectIds(rawSpeckleData)
  // if (!isHidden.value) {
  //   removeFromSelection(rawSpeckleData)
  //   filters.hideObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.showObjects(ids, stateKey, true)
}

const isolateOrUnisolateObject = () => {
  // const ids = getTargetObjectIds(rawSpeckleData)
  // if (!isIsolated.value) {
  //   filters.isolateObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.unIsolateObjects(ids, stateKey, true)
}
</script>

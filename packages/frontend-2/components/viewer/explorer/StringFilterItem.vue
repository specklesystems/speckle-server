<template>
  <div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`flex group pl-1 justify-between items-center w-full max-w-full overflow-hidden select-none space-x-2 rounded border-l-4 hover:bg-primary-muted hover:shadow-md transition-all ${
        availableTargetIds.length === 0 ? 'text-foreground-2' : 'text-foreground'
      } ${isSelected ? 'border-primary bg-primary-muted' : 'border-transparent'}`"
      @click="setSelection()"
    >
      <div class="flex space-x-2 items-center flex-shrink truncate">
        <span class="truncate">{{ item.value.split('.').reverse()[0] }}</span>
        <span class="text-xs text-foreground-2">({{ item.ids.length }})</span>
      </div>
      <!-- <div class="flex-grow"></div> -->
      <div v-if="false" class="flex items-center flex-shrink-0">
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
    <!-- <div v-if="true" class="text-xs text-foreground-2">
      selected: {{ isSelected }}; isHidden {{ isHidden }}; isIsolated: {{ isIsolated }}
    </div> -->
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

const {
  selection: {
    addToSelection,
    clearSelection,
    removeFromSelection,
    setSelectionFromObjectIds,
    objects
  },
  filters
} = useInjectedViewerInterfaceState()

const isSelected = computed(() => {
  const selObjsIds = objects.value.map((o) => o.id as string)

  return selObjsIds.some((id: string) => props.item.ids.includes(id)) //containsAll(props.item.ids, selObjsIds)
})

const availableTargetIds = computed(() => {
  let targets = props.item.ids

  if (isolatedObjects.value && isolatedObjects.value?.length > 0)
    targets = props.item.ids.filter((id) => isolatedObjects.value.includes(id))

  if (hiddenObjects.value && hiddenObjects.value?.length > 0)
    targets = props.item.ids.filter((id) => !hiddenObjects.value.includes(id))
  return targets
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(availableTargetIds.value)
}

const hiddenObjects = computed(() => filters.current.value?.hiddenObjects)
const isolatedObjects = computed(() => filters.current.value?.isolatedObjects)

const isHidden = computed(() => {
  if (!hiddenObjects.value) return false
  if (hiddenObjects.value.length === 0) return false
  const ids = props.item.ids
  return containsAll(ids, hiddenObjects.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjects.value) return false
  if (isolatedObjects.value.length === 0) return true
  const ids = props.item.ids
  return isolatedObjects.value.some((id: string) => ids.includes(id))
  // return containsAll(ids, isolatedObjects.value)
})

const stateKey = ViewerSceneExplorerStateKey

const hideOrShowObject = () => {
  // const ids = props.item.ids
  // if (!isHidden.value) {
  //   // removeFromSelection(rawSpeckleData)
  //   filters.hideObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.showObjects(ids, stateKey, true)
}

const isolateOrUnisolateObject = () => {
  // const ids = props.item.ids
  // if (!isIsolated.value) {
  //   filters.isolateObjects(ids, stateKey, true)
  //   return
  // }
  // return filters.unIsolateObjects(ids, stateKey, true)
}
</script>

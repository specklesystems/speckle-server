<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <button
      :class="`flex group px-1 justify-between items-center w-full max-w-full overflow-hidden select-none space-x-2 rounded hover:bg-foundation-2 py-0.5 text-foreground cursor-pointer ${
        isSelected ? ' bg-primary-muted' : ''
      }`"
      :title="item.value"
      @click="setSelection()"
    >
      <div class="flex gap-1 items-center flex-shrink truncate text-body-2xs">
        <span
          v-if="color"
          class="w-3 h-3 rounded"
          :style="`background-color: #${color};`"
        ></span>
        <span v-if="searchTerm && hasMatch" class="truncate">
          <span>{{ beforeMatch }}</span>
          <span class="font-bold">{{ match }}</span>
          <span>{{ afterMatch }}</span>
        </span>
        <span v-else-if="item.value" class="truncate">
          {{ item.value }}
        </span>
        <span v-else class="truncate">No name</span>
        <div class="flex">
          <span
            v-if="props.item.ids.length !== availableTargetIds.length"
            class="text-xs text-foreground-2"
          >
            {{ availableTargetIds.length }} ({{ props.item.ids.length }})
          </span>
          <span v-else class="text-xs text-foreground-2">
            {{ props.item.ids.length }}
          </span>
        </div>
      </div>
      <!-- 
        Note: not allowing for hiding/isolation CURRENTLY as there is a larger change needed. 
        Essentially, we need to have a two-state approach to visibility and isolation. 
        One is set by the explorer, and the other one by the filters - this would allow for us to 
        enable isolate this level, and from the remaining objects, isolate the doors only. 
        Requires a larger rework of the viewer state composable & filtering methods.

        There's v-if=false that's hiding the div below :)
      -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <!-- <button
          :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
            isHidden ? 'opacity-100' : ''
          }`"
          @click.stop="hideOrShowObject"
        > -->
        <EyeSlashIcon v-if="isHidden" class="h-3 w-3" />
        <!-- </button>
        <button
          :class="`hover:text-primary px-1 py-2 opacity-0 transition group-hover:opacity-100 ${
            isIsolated ? 'opacity-100' : ''
          }`"
          @click.stop="isolateOrUnisolateObject"
        > -->
        <FunnelIconOutline v-if="!isIsolated" class="h-3 w-3" />
        <FunnelIcon v-else class="h-3 w-3" />
        <!-- </button> -->
      </div>
    </button>
    <!-- Debugging info -->
    <!-- <div v-if="true" class="text-xs text-foreground-2">
      selected: {{ isSelected }}; isHidden {{ isHidden }}; isIsolated: {{ isIsolated }}
    </div> -->
  </div>
</template>
<script setup lang="ts">
import { EyeSlashIcon, FunnelIcon } from '@heroicons/vue/24/solid'
import { FunnelIcon as FunnelIconOutline } from '@heroicons/vue/24/outline'
import { containsAll, hasIntersection } from '~~/lib/common/helpers/utils'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useSelectionUtilities } from '~~/lib/viewer/composables/ui'

const props = defineProps<{
  item: {
    value: string
    ids: string[]
  }
  searchTerm?: string
}>()

const {
  ui: {
    filters: { isolatedObjectIds, hiddenObjectIds }
  },
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()
const { clearSelection, setSelectionFromObjectIds, objectIds } = useSelectionUtilities()

const isSelected = computed(() => hasIntersection(objectIds.value, props.item.ids))

const availableTargetIds = computed(() => {
  let targets = props.item.ids

  if (isolatedObjectIds.value.length) {
    const isolatedSet = new Set(isolatedObjectIds.value)
    targets = props.item.ids.filter((id) => isolatedSet.has(id))
  }

  return targets
})

const setSelection = () => {
  if (isSelected.value) return clearSelection()
  setSelectionFromObjectIds(availableTargetIds.value)
}

const isHidden = computed(() => {
  if (!hiddenObjectIds.value.length) return false
  const ids = props.item.ids
  return containsAll(ids, hiddenObjectIds.value)
})

const isIsolated = computed(() => {
  if (!isolatedObjectIds.value.length) return true
  const ids = props.item.ids
  const isolatedSet = new Set(isolatedObjectIds.value)
  return ids.some((id) => isolatedSet.has(id))
})

const color = computed(() => {
  return filteringState.value?.colorGroups?.find((gr) => gr.value === props.item.value)
    ?.color
})

// Simple text highlighting for search matches
const hasMatch = computed(() => {
  if (!props.searchTerm) return false
  const value = props.item.value
  return value.toLowerCase().includes(props.searchTerm.toLowerCase())
})

const beforeMatch = computed(() => {
  if (!hasMatch.value || !props.searchTerm) return ''
  const value = props.item.value
  const index = value.toLowerCase().indexOf(props.searchTerm.toLowerCase())
  return value.substring(0, index)
})

const match = computed(() => {
  if (!hasMatch.value || !props.searchTerm) return ''
  const value = props.item.value
  const searchTerm = props.searchTerm.toLowerCase()
  const index = value.toLowerCase().indexOf(searchTerm)
  return value.substring(index, index + props.searchTerm.length)
})

const afterMatch = computed(() => {
  if (!hasMatch.value || !props.searchTerm) return ''
  const value = props.item.value
  const searchTerm = props.searchTerm.toLowerCase()
  const index = value.toLowerCase().indexOf(searchTerm)
  return value.substring(index + props.searchTerm.length)
})

// It is possible to control the visibility and isolation of objects from here, There are
// some performance concerns here, so this is something to come back to. For now, the icons
// are purely indicators

// const hideOrShowObject = () => {
//   const ids = props.item.ids
//   if (!isHidden.value) {
//     // removeFromSelection(rawSpeckleData)
//     filters.hideObjects(ids, stateKey, true)
//     return
//   }
//   return filters.showObjects(ids, stateKey, true)
// }

// const isolateOrUnisolateObject = () => {
//   const ids = props.item.ids
//   if (!isIsolated.value) {
//     filters.isolateObjects(ids, stateKey, true)
//     return
//   }
//   return filters.unIsolateObjects(ids, stateKey, true)
// }
</script>

<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="w-full hover:bg-blue-500/5 rounded pl-1 py-0.5 border-l-2 text-body-3xs"
    :class="[
      expandable
        ? 'border-primary bg-foundation-page'
        : 'border-transparent bg-foundation',
      expanded ? 'border-neutral-500 border-opacity-30' : ''
    ]"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
    <div
      :class="`grid grid-cols-3 pr-1 ${expandable ? 'cursor-pointer' : ''}`"
      @click="handleExpand"
    >
      <div class="col-span-1 mr-1 flex items-center font-medium">
        <ChevronRightIcon
          v-if="expandable"
          :class="`w-3 ${expanded ? 'rotate-90' : ''} transition shrink-0 `"
        />
        <span class="select-all truncate" :title="`${prop.key} | ${prop.type}`">
          {{ prop.key }}
        </span>
      </div>
      <div v-if="!expandable" class="col-span-2 truncate select-all">
        {{ prop.value }}
      </div>
      <div
        v-if="expandable"
        class="col-span-2 truncate flex items-center justify-between"
      >
        {{ prop.type }}
        <span v-if="prop.type === 'array'" class="text-body-3xs">({{ arrayLen }})</span>
        <span v-if="isDetached" class="mr-1 flex space-x-1">
          <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content -->
          <a
            title="detached object - click to open in a new tab"
            :href="selectionLink"
            target="_blank"
            class="hover:text-primary"
          >
            <ArrowUpRightIcon class="w-3" />
          </a>
          <button
            title="isolate objects"
            class="hover:text-primary"
            @click.stop="handleHighlight"
          >
            <FunnelIcon class="w-2" />
          </button>
        </span>
      </div>
    </div>
    <div v-if="expandable && expanded" class="w-full pl-1 pt-2">
      <ViewerDataviewerObject :object="castProp" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon, ArrowUpRightIcon, FunnelIcon } from '@heroicons/vue/20/solid'
import { modelRoute } from '~/lib/common/helpers/route'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useFilterUtilities } from '~/lib/viewer/composables/ui'
const props = defineProps<{
  prop: {
    key: string
    value: unknown
    type: string
  }
}>()

const {
  projectId,
  viewer: {
    instance,
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const { isolateObjects, resetFilters } = useFilterUtilities()

const expanded = ref(false)

const expandable = computed(() => {
  return props.prop.type === 'array' || props.prop.type === 'object'
})

const arrayLen = computed(() => {
  if (props.prop.type !== 'array') return
  const arr = props.prop.value as unknown[]
  return arr.length
})

const castProp = computed(() => {
  return props.prop.value as Record<string, unknown>
})

const handleExpand = () => {
  if (!expandable.value) return
  expanded.value = !expanded.value
}

const isDetached = computed(() => {
  return (props.prop.value as { referencedId: string }).referencedId
})

const selectionLink = computed(() => {
  const refId = (props.prop.value as { referencedId: string }).referencedId
  if (!refId) return
  return modelRoute(projectId.value, refId)
})

const handleHighlight = () => {
  if (!isDetached.value) return
  const isIsolated = filteringState.value?.isolatedObjects?.includes(isDetached.value)
  if (isIsolated) return resetFilters()
  instance.zoom([isDetached.value])
  resetFilters()
  isolateObjects([isDetached.value])
}
</script>

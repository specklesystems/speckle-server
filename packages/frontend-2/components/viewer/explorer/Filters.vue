<template>
  <ViewerLayoutPanel class="mt-2" hide-close>
    <template #actions>
      <div class="flex justify-between items-center w-full">
        <div>
          <FormButton
            v-tippy="'Change Filter'"
            text
            size="xs"
            :icon-right="showAllFilters ? ChevronUpIcon : ChevronDownIcon"
            class="capitalize"
            @click="showAllFilters = !showAllFilters"
          >
            {{ title.split('.').reverse()[0] || title || 'No Title' }}
          </FormButton>
          <FormButton
            v-if="title !== 'Object Type'"
            text
            size="xs"
            @click="
              ;(showAllFilters = false),
                removePropertyFilter(),
                refreshColorsIfSetOrActiveFilterIsNumeric()
            "
          >
            Reset
          </FormButton>
        </div>
        <div>
          <FormButton
            v-tippy="'Toggle coloring'"
            size="xs"
            text
            @click="toggleColors()"
          >
            <IconColouringOutline v-if="!colors" class="w-3 h-3 text-primary" />
            <IconColouring v-else class="w-3 h-3 text-primary" />
          </FormButton>
        </div>
      </div>
    </template>
    <div
      :class="`relative flex flex-col space-y-2 px-2 simple-scrollbar overflow-y-scroll overflow-x-hidden shadow-inner ${
        showAllFilters ? 'h-44 visible py-2' : 'h-0 invisible py-1'
      } transition-[height] border-b-2 border-primary-muted`"
    >
      <div class="sticky top-0">
        <FormTextInput
          v-model="searchString"
          name="filter search"
          placeholder="Search for a property"
          size="sm"
          :show-clear="!!searchString"
        />
      </div>
      <div
        v-for="(filter, index) in relevantFiltersLimited"
        :key="index"
        class="text-xs px-1"
      >
        <button
          class="block w-full text-left hover:bg-primary-muted transition truncate rounded-md py-[1px]"
          @click="
            ;(showAllFilters = false),
              setPropertyFilter(filter),
              refreshColorsIfSetOrActiveFilterIsNumeric()
          "
        >
          {{ filter.key }}
        </button>
      </div>
      <div v-if="itemCount < relevantFiltersSearched.length" class="mb-2">
        <FormButton size="xs" text full-width @click="itemCount += 30">
          View More ({{ relevantFiltersSearched.length - itemCount }})
        </FormButton>
      </div>
    </div>
    <div v-if="activeFilter">
      <ViewerExplorerStringFilter
        v-if="activeFilter.type === 'string'"
        :filter="stringActiveFilter"
      />
      <ViewerExplorerNumericFilter
        v-if="activeFilter.type === 'number'"
        :filter="numericActiveFilter"
      />
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import type {
  PropertyInfo,
  StringPropertyInfo,
  NumericPropertyInfo
} from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'

const {
  setPropertyFilter,
  removePropertyFilter,
  applyPropertyFilter,
  unApplyPropertyFilter,
  filters: { propertyFilter }
} = useFilterUtilities()

const showAllFilters = ref(false)

const props = defineProps<{
  filters: PropertyInfo[]
}>()

const relevantFilters = computed(() => {
  return props.filters.filter((f) => {
    if (
      f.key.endsWith('.units') ||
      f.key.endsWith('.speckle_type') ||
      f.key.includes('.parameters.') ||
      // f.key.includes('level.') ||
      f.key.includes('renderMaterial') ||
      f.key.includes('.domain') ||
      f.key.includes('plane.') ||
      f.key.includes('baseLine') ||
      f.key.includes('referenceLine') ||
      f.key.includes('end.') ||
      f.key.includes('start.') ||
      f.key.includes('endPoint.') ||
      f.key.includes('midPoint.') ||
      f.key.includes('startPoint.') ||
      f.key.includes('startPoint.') ||
      f.key.includes('displayStyle') ||
      f.key.includes('displayValue') ||
      f.key.includes('displayMesh')
    ) {
      return false
    }
    // handle revit params: the actual one single value we're interested is in paramters.HOST_BLA BLA_.value, the rest are not needed
    if (f.key.startsWith('parameters')) {
      if (f.key.endsWith('.value')) return true
      else return false
    }
    return true
  })
})

const speckleTypeFilter = computed(
  () =>
    relevantFilters.value.find((f) => f.key === 'speckle_type') as StringPropertyInfo
)
const activeFilter = computed(
  () => propertyFilter.filter.value || speckleTypeFilter.value
)

const mp = useMixpanel()
watch(activeFilter, (newVal) => {
  if (!newVal) return
  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'set-active-filter',
    value: newVal.key
  })
})

// Using these as casting activeFilter as XXX in the prop causes some syntax highliting bug to show. Apologies :)
const stringActiveFilter = computed(() => activeFilter.value as StringPropertyInfo)
const numericActiveFilter = computed(() => activeFilter.value as NumericPropertyInfo)

const searchString = ref<string | undefined>(undefined)
const relevantFiltersSearched = computed(() => {
  if (!searchString.value) return relevantFilters.value
  itemCount.value = 30 // nasty, but yolo - reset max limit on search change
  return relevantFilters.value.filter((f) =>
    f.key.toLowerCase().includes((searchString.value as string).toLowerCase())
  )
})

const itemCount = ref(30)
const relevantFiltersLimited = computed(() => {
  return relevantFiltersSearched.value
    .slice(0, itemCount.value)
    .sort((a, b) => a.key.length - b.key.length)
})

// Too lazy to follow up in here for now, as i think we need a bit of a better strategy in connectors first :/
const title = computed(() => {
  const currentFilterKey = activeFilter.value?.key
  if (!currentFilterKey) return 'Loading'

  if (currentFilterKey === 'level.name') return 'Level Name'
  if (currentFilterKey === 'speckle_type') return 'Object Type'

  // Handle revit names :/
  if (
    currentFilterKey.startsWith('parameters.') &&
    currentFilterKey.endsWith('.value')
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return (
      props.filters.find(
        (f) => f.key === currentFilterKey.replace('.value', '.name')
      ) as StringPropertyInfo
    ).valueGroups[0].value
  }

  return currentFilterKey
})

const colors = computed(() => !!propertyFilter.isApplied.value)

const toggleColors = () => {
  if (!colors.value) applyPropertyFilter()
  else unApplyPropertyFilter()
  mp.track('Viewer Action', {
    type: 'action',
    name: 'filters',
    action: 'toggle-colors',
    value: colors.value
  })
}

// Handles a rather complicated ux flow: user sets a numeric filter which only makes sense with colors on. we set the force colors flag in that scenario, so we can revert it if user selects a non-numeric filter afterwards.
let forcedColors = false
const refreshColorsIfSetOrActiveFilterIsNumeric = () => {
  if (activeFilter.value.type === 'number' && !colors.value) {
    forcedColors = true
    applyPropertyFilter()
    return
  }

  if (!colors.value) return

  if (forcedColors) {
    forcedColors = false
    unApplyPropertyFilter()
    return
  }

  // removePropertyFilter()
  applyPropertyFilter()
}
</script>

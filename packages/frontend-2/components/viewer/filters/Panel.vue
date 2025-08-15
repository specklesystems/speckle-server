<template>
  <ViewerLayoutSidePanel>
    <template #title>Filters</template>
    <template #actions>
      <div class="flex gap-x-0.5 items-center">
        <FormButton
          v-if="title !== 'Object Type'"
          size="sm"
          color="subtle"
          tabindex="-1"
          @click="
            ;(showAllFilters = false),
              removePropertyFilter(),
              refreshColorsIfSetOrActiveFilterIsNumeric()
          "
        >
          Reset
        </FormButton>
        <FormButton
          v-tippy="'Toggle coloring'"
          color="subtle"
          size="sm"
          hide-text
          :icon-right="colors ? 'IconColouring' : 'IconColouringOutline'"
          @click="toggleColors()"
        />
      </div>
    </template>

    <div class="h-full flex flex-col">
      <div class="px-4 py-1 border-b border-outline-2">
        <FormButton
          text
          color="subtle"
          size="sm"
          :icon-right="showAllFilters ? ChevronUpIcon : ChevronDownIcon"
          class="capitalize"
          @click="showAllFilters = !showAllFilters"
        >
          <span class="max-w-20 md:max-w-36 truncate">
            {{ title.split('.').reverse()[0] || title || 'No title' }}
          </span>
        </FormButton>
      </div>

      <div
        :class="`relative flex flex-col gap-0.5 simple-scrollbar overflow-y-scroll overflow-x-hidden ${
          showAllFilters ? 'h-44 visible pb-2' : 'h-0 invisible'
        } transition-[height] border-b border-outline-2`"
      >
        <div class="sticky top-0 bg-foundation p-2 pb-1">
          <FormTextInput
            v-model="searchString"
            name="filter-search"
            placeholder="Search for a property"
            size="sm"
            color="foundation"
            :show-clear="!!searchString"
            class="!text-body-2xs"
          />
        </div>
        <div>
          <div
            v-for="(filter, index) in relevantFiltersLimited"
            :key="index"
            class="text-body-2xs"
          >
            <button
              class="flex w-full text-left hover:bg-primary-muted truncate rounded-md py-[3px] px-2 mx-2 text-[10px] text-foreground-3 gap-1 items-center"
              @click="
                ;(showAllFilters = false),
                  setPropertyFilter(filter),
                  refreshColorsIfSetOrActiveFilterIsNumeric()
              "
            >
              <span class="text-foreground text-body-3xs">
                {{ getPropertyName(filter.key) }}
              </span>
              <span class="truncate">{{ filter.key }}</span>
            </button>
          </div>
          <div v-if="itemCount < relevantFiltersSearched.length" class="px-4">
            <FormButton size="sm" text @click="itemCount += 30">
              View more ({{ relevantFiltersSearched.length - itemCount }})
            </FormButton>
          </div>
        </div>
      </div>

      <div v-if="activeFilter" class="overflow-y-scroll simple-scrollbar flex-1">
        <ViewerFiltersStringFilter
          v-if="stringActiveFilter"
          :filter="stringActiveFilter"
        />
        <ViewerFiltersNumericFilter
          v-if="numericActiveFilter"
          :filter="numericActiveFilter"
        />
      </div>
    </div>
  </ViewerLayoutSidePanel>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import type { PropertyInfo } from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  isNumericPropertyInfo,
  isStringPropertyInfo
} from '~/lib/viewer/helpers/sceneExplorer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'

const {
  setPropertyFilter,
  removePropertyFilter,
  applyPropertyFilter,
  unApplyPropertyFilter,
  filters: { propertyFilter },
  getRelevantFilters,
  getPropertyName
} = useFilterUtilities()

const {
  metadata: { availableFilters: allFilters }
} = useInjectedViewer()

const showAllFilters = ref(false)

const relevantFilters = computed(() => {
  return getRelevantFilters(allFilters.value)
})

const speckleTypeFilter = computed(() =>
  relevantFilters.value.find((f: PropertyInfo) => f.key === 'speckle_type')
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

const stringActiveFilter = computed(() =>
  isStringPropertyInfo(activeFilter.value) ? activeFilter.value : undefined
)
const numericActiveFilter = computed(() =>
  isNumericPropertyInfo(activeFilter.value) ? activeFilter.value : undefined
)

const searchString = ref<string | undefined>(undefined)
const relevantFiltersSearched = computed(() => {
  if (!searchString.value) return relevantFilters.value
  const searchLower = searchString.value.toLowerCase()
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  itemCount.value = 30 // nasty, but yolo - reset max limit on search change
  return relevantFilters.value.filter((f: PropertyInfo) => {
    const userFriendlyName = getPropertyName(f.key).toLowerCase()
    return (
      f.key.toLowerCase().includes(searchLower) ||
      userFriendlyName.includes(searchLower)
    )
  })
})

const itemCount = ref(30)
const relevantFiltersLimited = computed(() => {
  return relevantFiltersSearched.value
    .slice(0, itemCount.value)
    .sort((a: PropertyInfo, b: PropertyInfo) => a.key.length - b.key.length)
})

const title = computed(() => getPropertyName(activeFilter.value?.key ?? ''))

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
  if (!!numericActiveFilter.value && !colors.value) {
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

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
            @click="showAllFilters = !showAllFilters"
          >
            {{ title.split('.').reverse()[0] || title || 'No Title' }}
          </FormButton>
          <!-- // TODO: when resetting, reset colors as well if applied -->
          <FormButton
            v-if="title !== 'Object Type'"
            text
            size="xs"
            @click="
              ;(activeFilter = null), (showAllFilters = false), refreshColorsIfSet()
            "
          >
            Reset
          </FormButton>
        </div>
        <!-- Disabling as something is wrong with colors -->
        <div>
          <FormButton
            v-tippy="'Toggle coloring'"
            size="xs"
            text
            @click="toggleColors()"
          >
            <SparklesIconOutline v-if="!colors" class="w-3 h-3 text-primary" />
            <SparklesIcon v-else class="w-3 h-3 text-primary" />
          </FormButton>
        </div>
      </div>
    </template>
    <div
      :class="`relative flex flex-col space-y-2 py-2 px-2 simple-scrollbar overflow-y-scroll overflow-x-hidden shadow-inner ${
        showAllFilters ? 'h-44 visible' : 'h-0 invisible'
      } transition-[height] border-b-2 border-primary-muted`"
    >
      <div class="sticky top-0">
        <FormTextInput
          v-model="searchString"
          name="filter search"
          placeholder="Search for a property"
          size="sm"
        />
      </div>
      <div
        v-for="(filter, index) in stringFiltersLimited"
        :key="index"
        class="text-xs px-1"
      >
        <button
          class="block w-full text-left hover:bg-primary-muted transition truncate rounded-md py-[1px]"
          @click="
            ;(activeFilter = filter), (showAllFilters = false), refreshColorsIfSet()
          "
        >
          {{ filter.key }}
        </button>
      </div>
      <div v-if="itemCount < stringFiltersSearched.length" class="mb-2">
        <FormButton size="xs" text full-width @click="itemCount += 30">
          View More ({{ stringFiltersSearched.length - itemCount }})
        </FormButton>
      </div>
    </div>
    <div>
      <ViewerExplorerStringFilter :filter="activeFilter || speckleTypeFilter" />
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/vue/24/solid'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { SparklesIcon as SparklesIconOutline } from '@heroicons/vue/24/outline'
import { PropertyInfo, StringPropertyInfo } from '@speckle/viewer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
const { instance: viewer } = useInjectedViewer()

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
    return true
  })
})

const activeFilter = ref<StringPropertyInfo | null>(null)

const colors = ref(false)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toggleColors = () => {
  colors.value = !colors.value

  if (colors.value) viewer.setColorFilter(activeFilter.value || speckleTypeFilter.value)
  else viewer.removeColorFilter()
}

const refreshColorsIfSet = async () => {
  if (!colors.value) return
  await viewer.removeColorFilter()
  await viewer.setColorFilter(activeFilter.value || speckleTypeFilter.value)
}

const speckleTypeFilter = computed(
  () =>
    relevantFilters.value.find((f) => f.key === 'speckle_type') as StringPropertyInfo
)

const stringFilters = computed(
  () => relevantFilters.value.filter((f) => f.type === 'string') as StringPropertyInfo[]
)

const searchString = ref<string | undefined>(undefined)
const stringFiltersSearched = computed(() => {
  if (!searchString.value) return stringFilters.value
  itemCount.value = 30 // nasty, but yolo - reset max limit on search change
  return stringFilters.value.filter((f) =>
    f.key.toLowerCase().includes((searchString.value as string).toLowerCase())
  )
})

const itemCount = ref(30)
const stringFiltersLimited = computed(() => {
  return stringFiltersSearched.value.slice(0, itemCount.value)
})

// const numericFilters = computed(() => props.filters.filter((f) => f.type === 'number'))

// Too lazy to follow up in here for now, as i think we need a bit of a better strategy in connectors first :/
const title = computed(() => {
  const currentFilterKey =
    activeFilter.value?.key || speckleTypeFilter.value?.key || 'Loading'

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
</script>

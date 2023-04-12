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
          <FormButton
            v-if="title !== 'Object Type'"
            text
            size="xs"
            @click=";(activeFilter = null), (showAllFilters = false)"
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
        <FormTextInput name="filter search" placeholder="Search" size="sm" />
      </div>
      <div v-for="(filter, index) in stringFilters" :key="index" class="text-xs px-1">
        <button
          class="block w-full text-left hover:bg-primary-muted transition truncate rounded-md py-[1px]"
          @click=";(activeFilter = filter), (showAllFilters = false)"
        >
          {{ filter.key }}
          <!-- , {{ filter.objectCount }} -->
        </button>
      </div>
    </div>
    <div>
      <ViewerExplorerStringFilter :filter="activeFilter || speckleTypeFilter" />
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon, SparklesIcon } from '@heroicons/vue/24/solid'
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
      f.key.includes('level.') ||
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
const toggleColors = () => {
  colors.value = !colors.value

  if (colors.value) viewer.setColorFilter(activeFilter.value || speckleTypeFilter.value)
  else viewer.removeColorFilter()
}

const speckleTypeFilter = computed(
  () =>
    relevantFilters.value.find((f) => f.key === 'speckle_type') as StringPropertyInfo
)

const stringFilters = computed(
  () => relevantFilters.value.filter((f) => f.type === 'string') as StringPropertyInfo[]
)
// const numericFilters = computed(() => props.filters.filter((f) => f.type === 'number'))

// Too lazy to follow up in here for now.
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

<template>
  <ViewerLayoutPanel class="mt-2" hide-close>
    <template #actions>
      <!-- <div class="text-xs font-medium">Object Type</div> -->
      <FormButton
        v-tippy="'Change Filter'"
        text
        size="xs"
        :icon-right="showAllFilters ? ChevronUpIcon : ChevronDownIcon"
        @click="showAllFilters = !showAllFilters"
      >
        Object Types
      </FormButton>
    </template>
    <div
      :class="`relative flex flex-col space-y-2 py-2 px-2 simple-scrollbar overflow-y-scroll overflow-x-hidden shadow-inner ${
        showAllFilters ? 'h-44 visible' : 'h-0 invisible'
      } transition-[height] border-b-2 border-primary-muted`"
    >
      <div>
        <FormTextInput name="filter search" placeholder="Search" size="sm" />
      </div>
      <div v-for="(filter, index) in stringFilters" :key="index" class="text-xs px-1">
        {{ filter.key }}, {{ filter.objectCount }}
      </div>
    </div>
    <div>
      <!-- {{ speckleTypeFilter }} -->
      <ViewerExplorerStringFilter :filter="speckleTypeFilter" />
    </div>
  </ViewerLayoutPanel>
</template>
<script setup lang="ts">
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import { PropertyInfo, StringPropertyInfo } from '@speckle/viewer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'

const { instance: viewer } = useInjectedViewer()

const showAllFilters = ref(false)

const props = defineProps<{
  filters: PropertyInfo[]
}>()

const speckleTypeFilter = computed(
  () => props.filters.find((f) => f.key === 'speckle_type') as StringPropertyInfo
)

const stringFilters = computed(() => props.filters.filter((f) => f.type === 'string'))
const numericFilters = computed(() => props.filters.filter((f) => f.type === 'number'))
</script>

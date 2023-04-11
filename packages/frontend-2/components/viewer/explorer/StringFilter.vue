<template>
  <div v-if="filter" class="pr-3 pl-2 flex flex-col space-y-2 pb-2">
    <ViewerExplorerStringFilterItem
      v-for="(vg, index) in filter.valueGroups"
      :key="index"
      :item="vg"
    />
  </div>
</template>
<script setup lang="ts">
// import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/solid'
import { StringPropertyInfo } from '@speckle/viewer'
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'

const { instance: viewer } = useInjectedViewer()

// const showAllFilters = ref(false)

const props = defineProps<{
  filter: StringPropertyInfo
}>()
</script>

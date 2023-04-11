<template>
  <div v-if="filter" class="px-3">
    <ViewerExplorerStringFilterItem
      v-for="(vg, index) in filter.valueGroups"
      :key="index"
      :item="vg"
    />
    <!-- <div v-for="(vg, index) in filter.valueGroups" :key="index">
      <div class="text-sm">{{ vg.value }} | {{ vg.ids.length }}</div>
    </div> -->
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

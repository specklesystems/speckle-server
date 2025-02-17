<template>
  <div class="pr-3 pl-2 flex flex-col space-y-2 pb-2">
    <ViewerExplorerStringFilterItem
      v-for="(vg, index) in groupsLimited"
      :key="index"
      :item="vg"
    />
    <div v-if="itemCount < filter.valueGroups.length" class="mb-2">
      <FormButton size="sm" text full-width @click="itemCount += 30">
        View more ({{ filter.valueGroups.length - itemCount }})
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { StringPropertyInfo } from '@speckle/viewer'
const props = defineProps<{
  filter: StringPropertyInfo
}>()

const itemCount = ref(30)
const groupsLimited = computed(() => {
  return props.filter.valueGroups.slice(0, itemCount.value)
})
</script>

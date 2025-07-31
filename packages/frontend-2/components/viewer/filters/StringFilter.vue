<template>
  <div class="pr-3 p-2 flex flex-col space-y-2">
    <div class="sticky top-0 bg-foundation">
      <FormTextInput
        v-model="searchString"
        name="string-filter-search"
        placeholder="Search for a value"
        size="sm"
        color="foundation"
        :show-clear="!!searchString"
        class="!text-body-2xs"
      />
    </div>
    <ViewerFiltersStringFilterItem
      v-for="(vg, index) in filteredGroup"
      :key="index"
      :item="vg"
      :search-term="searchString"
    />
    <div v-if="itemCount < totalFilteredCount" class="mb-2">
      <FormButton size="sm" text full-width @click="itemCount += 30">
        View more ({{ totalFilteredCount - itemCount }})
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
const searchString = ref<string | undefined>(undefined)

const filteredGroups = computed(() => {
  if (!searchString.value) return props.filter.valueGroups

  const searchLower = searchString.value.toLowerCase()
  return props.filter.valueGroups.filter((f) =>
    f.value.toLowerCase().includes(searchLower)
  )
})

const filteredGroup = computed(() => {
  return filteredGroups.value.slice(0, itemCount.value)
})

const totalFilteredCount = computed(() => filteredGroups.value.length)
</script>

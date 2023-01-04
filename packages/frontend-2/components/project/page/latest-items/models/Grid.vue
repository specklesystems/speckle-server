<template>
  <div class="grid grid-cols-12 space-y-8 sm:space-y-0 sm:gap-8">
    <ProjectPageLatestItemsModelsGridItem
      v-for="item in items"
      :key="item.id"
      :model="item"
      :class="gridItemWidthClasses"
    />
  </div>
</template>
<script setup lang="ts">
import { ProjectLatestModelsQuery } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  models?: ProjectLatestModelsQuery
}>()

const items = computed(() => (props.models?.project?.models?.items || []).slice(0, 8))

const gridItemWidthClasses = computed(
  () => 'col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3'
)
</script>

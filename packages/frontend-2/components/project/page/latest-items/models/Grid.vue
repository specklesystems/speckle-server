<template>
  <div class="grid grid-cols-12 gap-8">
    <ProjectPageLatestItemsModelsGridItem
      v-for="item in items"
      :key="item.id"
      :model="item"
      class="col-span-3"
    />
  </div>
</template>
<script setup lang="ts">
import { ProjectLatestModelsQuery } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  models?: ProjectLatestModelsQuery
}>()

const items = computed(() => (props.models?.project?.models?.items || []).slice(0, 8))
</script>

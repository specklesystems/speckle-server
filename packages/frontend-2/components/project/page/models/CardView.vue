<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
    <ProjectPageModelsCard
      v-for="(model, idx) in sortedModels"
      :key="idx"
      :model="model"
      :project-id="(route.params.id as string)"
    />
  </div>
</template>
<script setup lang="ts">
import { Model } from '~~/lib/common/generated/gql/graphql'

const props = defineProps<{
  models: Model[]
}>()

const route = useRoute()
const sortedModels = computed(() => {
  return [...props.models].sort(
    (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
  )
})
</script>

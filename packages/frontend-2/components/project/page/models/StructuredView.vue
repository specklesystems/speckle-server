<template>
  <div class="space-y-4 mb-14 max-w-full">
    <div v-for="(model, idx) in modelTree" :key="idx">
      <ProjectPageModelsStructureItem2 :item="(model as StructuredModel)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { StructuredModel } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  modelTree: StructuredModel[] | undefined
}>()
</script>

<template>
  <div class="space-y-4 mb-14 max-w-full">
    <ProjectPageModelsNewModelStructureItem />
    <div v-for="(model, idx) in modelTree" :key="idx">
      <ProjectPageModelsStructureItem2 :item="(model as StructuredModel)" />
    </div>
    <!-- <FormButton full-width :icon-left="PlusIcon" size="lg" color="card">New</FormButton> -->
  </div>
</template>
<script setup lang="ts">
import { StructuredModel } from '~~/lib/common/generated/gql/graphql'
import { PlusIcon } from '@heroicons/vue/24/solid'
defineProps<{
  modelTree: StructuredModel[] | undefined
}>()
</script>

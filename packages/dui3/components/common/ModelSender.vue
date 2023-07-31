<template>
  <div
    class="bg-foundation p-4 rounded-md hover:shadow-md flex flex-col items-center shadow transition h-16 transition-[height]"
  >
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center space-x-2">
        <UserAvatar :user="modelDetails.author" />
        <span>{{ modelDetails.displayName }}</span>
      </div>
      {{ modelDetails.versions.totalCount }}
      <CloudArrowUpIcon class="text-primary w-8 h-8" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon } from '@heroicons/vue/24/outline'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ModelCard } from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { ProjectModelGroup } from '~~/store/documentState'
const props = defineProps<{
  model: ModelCard
  project: ProjectModelGroup
}>()

const getModelDetails = useGetModelDetails(props.project.accountId)
const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})
</script>

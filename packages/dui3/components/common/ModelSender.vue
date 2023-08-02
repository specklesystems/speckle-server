<template>
  <div
    class="bg-foundation p-4 rounded-md hover:shadow-md flex flex-col items-center shadow transition h-16 transition-[height]"
  >
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center space-x-2">
        <UserAvatar :user="modelDetails.author" />
        <span>{{ modelDetails.displayName }}</span>
      </div>
      <!-- {{ modelDetails.versions.totalCount }} -->
      <div class="flex items-center space-x-2">
        <FormButton
          v-tippy="'Change or edit filter'"
          size="xs"
          text
          :icon-left="FunnelIcon"
          @click="openFilterDialog = true"
        >
          {{ model.sendFilter.name }}
        </FormButton>
        <CloudArrowUpIcon class="text-primary w-8 h-8" />
      </div>
    </div>
    <LayoutDialog v-model:open="openFilterDialog">
      <FilterEditDialog :model="model" />
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ISenderModelCard } from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { ProjectModelGroup } from '~~/store/documentState'
const props = defineProps<{
  model: ISenderModelCard
  project: ProjectModelGroup
}>()

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const openFilterDialog = ref(false)
</script>

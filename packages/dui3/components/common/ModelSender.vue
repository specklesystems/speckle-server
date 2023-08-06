<template>
  <div
    :class="`bg-foundation rounded-md hover:shadow-md shadow transition overflow-hidden ${
      model.expired ? 'outline outline-blue-500/10' : ''
    }`"
  >
    <div class="flex items-center h-20 justify-between w-full p-2">
      <div class="flex items-center space-x-2">
        <UserAvatar :user="modelDetails.author" />
        <span>{{ modelDetails.displayName }}</span>
      </div>
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
    <div
      :class="`bg-blue-500/10 text-primary flex items-center space-x-2 px-2  ${
        model.expired ? 'h-12 opacity-100  py-1' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <button
        class="flex items-center space-x-2 text-left hover:scale-95 transition"
        @click="model.expired = false"
      >
        <ExclamationTriangleIcon class="w-6" />
        <div class="text-sm">Out of date. Click here to publish again!</div>
      </button>
    </div>
    <LayoutDialog v-model:open="openFilterDialog">
      <FilterEditDialog :model="model" @close="openFilterDialog = false" />
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import {
  CloudArrowUpIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ISenderModelCard } from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { ProjectModelGroup } from '~~/store/hostApp'

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

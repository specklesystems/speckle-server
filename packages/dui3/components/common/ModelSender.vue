<template>
  <div class="flex items-center space-x-2">
    <UserAvatar :user="modelDetails.author" size="sm" />
    <span v-tippy="modelDetails.displayName" class="truncate">
      {{
        modelDetails.displayName.length > 8
          ? modelDetails.displayName.slice(0, 8) + '...'
          : modelDetails.displayName
      }}
    </span>
  </div>
  <div class="flex items-center space-x-2">
    <FormButton
      v-tippy="'Change or edit filter'"
      size="sm"
      text
      :icon-left="FunnelIcon"
      @click="openFilterDialog = true"
    >
      {{ model.sendFilter.name }}
    </FormButton>
    <FormButton
      v-if="!model.sending"
      v-tippy="'Publish'"
      size="sm"
      :icon-left="CloudArrowUpIcon"
      :text="!model.expired"
      class="flex items-center justify-center"
      @click="store.sendModel(model.id)"
    >
      Publish
    </FormButton>
    <FormButton
      v-else
      v-tippy="'Cancel'"
      size="sm"
      class="flex items-center justify-center"
      @click="store.sendModelCancel(model.id)"
    >
      Cancel
    </FormButton>
  </div>
  <LayoutDialog v-model:open="openFilterDialog">
    <FilterEditDialog :model="model" @close="openFilterDialog = false" />
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import { ISenderModelCard } from '~~/lib/models/card/send'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()

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

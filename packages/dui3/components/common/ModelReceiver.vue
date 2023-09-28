<template>
  <div class="flex items-center space-x-2">
    <UserAvatar :user="modelDetails.author" size="sm" />
    <span>{{ modelDetails.displayName }}</span>
  </div>
  <div class="flex items-center space-x-2">
    <FormButton
      v-if="!model.receiving"
      v-tippy="'Receive'"
      size="sm"
      :icon-left="CloudArrowDownIcon"
      :text="!model.expired"
      class="flex items-center justify-center"
      @click="store.receiveModel(model.id, selectedVersion?.id as string)"
    >
      Receive
    </FormButton>
    <FormButton
      v-else
      v-tippy="'Cancel'"
      size="sm"
      class="flex items-center justify-center"
      @click="store.receiveModelCancel(model.id)"
    >
      Cancel
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { CloudArrowDownIcon } from '@heroicons/vue/24/outline'
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { VersionsSelectItemType } from '~/lib/form/select/types'
import { useGetModelDetails, useProjectVersionUpdated } from '~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'

const store = useHostAppStore()

const props = defineProps<{
  model: IReceiverModelCard
  project: ProjectModelGroup
}>()

const selectedVersion = ref<VersionsSelectItemType>()

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const onProjectVersionsUpdate = useProjectVersionUpdated()
const projectVersionsUpdated = onProjectVersionsUpdate(props.project.projectId)

projectVersionsUpdated.onResult(() => store.invalidateReceiver(props.model.id))
</script>

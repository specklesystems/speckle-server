<template>
  <div
    :class="`bg-foundation rounded-md hover:shadow-md shadow transition overflow-hidden ${
      model.expired ? 'outline outline-blue-500/10' : ''
    }`"
  >
    <div class="flex items-center h-20 justify-between w-full p-2">
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
    </div>
    <!-- Expired State -->
    <div
      :class="`bg-blue-500/10 text-primary flex items-center space-x-2 px-2  ${
        model.expired ? 'h-8 opacity-100  py-1' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <div class="flex items-center space-x-2 text-left">
        <ExclamationTriangleIcon class="w-3" />
        <div class="text-xs">Received model is out of sync with file.</div>
      </div>
    </div>
    <!-- Receiving state -->
    <div
      :class="`bg-blue-500/10 text-primary ${
        model.receiving ? 'h-8 opacity-100' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <CommonLoadingBar :loading="true" class="h-1" />
      <div v-if="model.receiving" class="text-xs px-2 pt-1">
        {{ progressBarText }}
      </div>
      <div v-else class="text-xs px-2 pt-1">Completed!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CloudArrowDownIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { IReceiverModelCard } from '~/lib/bindings/definitions/IReceiveBinding'
import { VersionsSelectItemType } from '~/lib/form/select/types'
import { useGetModelDetails, useProjectVersionUpdated } from '~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'

const store = useHostAppStore()

const props = defineProps<{
  model: IReceiverModelCard
  project: ProjectModelGroup
}>()

const selectedVersion = ref<VersionsSelectItemType>()

const progressBarValue = () => {
  if (props.model.progress === undefined) {
    return 0
  } else {
    return ((props.model.progress.progress as number) * 100).toFixed(2)
  }
}

const progressBarText = computed(() => {
  if (props.model.progress?.status === undefined) {
    return 'Progressing'
  } else if (props.model.progress?.status === 'Receiving') {
    return `${props.model.progress?.status} (% ${progressBarValue()})`
  } else {
    return props.model.progress.status
  }
})

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const onProjectVersionsUpdate = useProjectVersionUpdated()
const projectVersionsUpdated = onProjectVersionsUpdate(props.project.projectId)

watch(projectVersionsUpdated, (newVal) => {
  store.invalidateReceiver(props.model.modelId)
  console.log(newVal)
})
</script>

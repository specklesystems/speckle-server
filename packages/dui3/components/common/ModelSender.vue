<template>
  <div
    :class="`bg-foundation rounded-md hover:shadow-md shadow transition overflow-hidden ${
      model.expired ? 'outline outline-blue-500/10' : ''
    }`"
    @onmouseenter="onHover = true"
    @onmouseleave="onHover = false"
  >
    <div class="space-y-2">
      <div class="flex items-center">
        <FormButton
          v-if="onHover"
          key="removeCard"
          v-tippy="'Remove Card'"
          size="sm"
          text
          hide-text
          :icon-left="TrashIcon"
          @click="openRemoveCardDialog = true"
        />
      </div>
      <div class="flex items-center h-20 justify-between w-full p-2">
        <div class="flex items-center space-x-2">
          <UserAvatar :user="modelDetails.author" size="sm" />
          <span>{{ modelDetails.displayName }}</span>
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
        <div class="text-xs">Published model is out of sync with file.</div>
      </div>
    </div>
    <!-- Sending state -->
    <div
      :class="`bg-blue-500/10 text-primary ${
        model.sending ? 'h-8 opacity-100' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <CommonLoadingBar :loading="true" class="h-1" />
      <div v-if="model.sending" class="text-xs px-2 pt-1">
        {{ progressBarText }}
      </div>
      <div v-else class="text-xs px-2 pt-1">Completed!</div>
    </div>
    <!-- Card Notification -->
    <CommonModelNotification
      v-if="props.model.notification"
      :notification="props.model.notification"
    />

    <!-- TODO: Post send state -->
    <!-- 
      Think about:
        - view version is DONE with CommonModelNotification!
        - view report 
    -->
    <!-- <div
      :class="`bg-green-500/5 text-green-600 flex items-center ${
        true ? 'h-8 opacity-100' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <div class="text-xs px-2">Post send state & actions</div>
    </div> -->

    <LayoutDialog v-model:open="openFilterDialog">
      <FilterEditDialog :model="model" @close="openFilterDialog = false" />
    </LayoutDialog>
    <LayoutDialog v-model:open="openRemoveCardDialog">
      <FilterEditDialog :model="model" @close="openRemoveCardDialog = false" />
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import {
  CloudArrowUpIcon,
  TrashIcon,
  FunnelIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ISenderModelCard } from '~~/lib/bindings/definitions/ISendBinding'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()

const props = defineProps<{
  model: ISenderModelCard
  project: ProjectModelGroup
}>()

const getModelDetails = useGetModelDetails(props.project.accountId)

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
  } else if (props.model.progress?.status === 'Converting') {
    return `${props.model.progress?.status} (% ${progressBarValue()})`
  } else {
    return props.model.progress.status
  }
})

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const openFilterDialog = ref(false)
const openRemoveCardDialog = ref(false)
const onHover = ref(false)
</script>

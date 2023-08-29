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
      <!-- <CommonLoadingBar :loading="true" class="h-1" /> -->
      <CommonLoadingProgressBar :loading="true" :progress="model.progress?.progress" />
      <div class="text-xs px-2 pt-1">{{ model.progress?.status }}</div>
    </div>

    <!-- TODO: Post send state -->
    <!-- 
      Think about:
        - view version
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
  </div>
</template>
<script setup lang="ts">
import {
  CloudArrowUpIcon,
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

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const openFilterDialog = ref(false)
</script>

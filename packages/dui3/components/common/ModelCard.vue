<template>
  <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
  <div
    :class="`bg-foundation rounded-md hover:shadow-md shadow transition overflow-hidden ${
      modelCard.expired ? 'outline outline-blue-500/10' : ''
    }`"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="flex items-center h-20 justify-between w-full p-2">
      <slot></slot>
      <Transition
        enter-from-class="opacity-0"
        enter-active-class="transition duration-300"
        leave-to-class="opacity-0"
        leave-active-class="transition duration-300"
      >
        <FormButton
          v-if="hovered"
          key="removeCard"
          v-tippy="'Remove Card'"
          size="sm"
          text
          hide-text
          :icon-left="TrashIcon"
          @click="openRemoveCardDialog = true"
        />
      </Transition>
    </div>

    <div
      :class="`bg-blue-500/10 text-primary flex items-center space-x-2 px-2  ${
        modelCard.expired ? 'h-8 opacity-100  py-1' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <div class="flex items-center space-x-2 text-left">
        <ExclamationTriangleIcon class="w-3" />
        <div class="text-xs">Model is out of sync with file.</div>
      </div>
    </div>

    <!-- Progress state -->
    <div
      :class="`bg-blue-500/10 text-primary ${
        onProgress ? 'h-8 opacity-100' : 'h-0 opacity-0 py-0'
      } transition-[height,scale,opacity] overflow-hidden`"
    >
      <CommonLoadingProgressBar
        :loading="true"
        :progress="
          props.modelCard.progress ? props.modelCard.progress.progress : undefined
        "
      />
      <div v-if="onProgress" class="text-xs px-2 pt-1">
        {{ progressBarText }}
      </div>
      <div v-else class="text-xs px-2 pt-1">Completed!</div>
    </div>
    <!-- Card Notification -->
    <CommonModelNotification
      v-if="props.modelCard.notification"
      :notification="props.modelCard.notification"
    />
    <LayoutDialog v-model:open="openRemoveCardDialog">
      <FormButton @click="removeCard">Remove</FormButton>
      <!-- <RemoveCardDialog :model="modelCard" @close="openRemoveCardDialog = false" /> -->
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { IModelCard } from '~~/lib/bindings/definitions/IBasicConnectorBinding'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'

const store = useHostAppStore()

const props = defineProps<{
  modelCard: IModelCard
  project: ProjectModelGroup
}>()

const onProgress = computed(() => props.modelCard.progress !== undefined)

const progressBarValue = () => {
  if (props.modelCard.progress === undefined) {
    return 0
  } else {
    return ((props.modelCard.progress.progress as number) * 100).toFixed(2)
  }
}

const progressBarText = computed(() => {
  if (props.modelCard.progress?.status === undefined) {
    return 'Progressing'
  } else if (props.modelCard.progress?.status === 'Converting') {
    return `${props.modelCard.progress?.status} (% ${progressBarValue()})`
  } else {
    return props.modelCard.progress.status
  }
})

const removeCard = () => {
  store.removeModel(props.modelCard)
}

const openRemoveCardDialog = ref(false)
const hovered = ref(false)
</script>

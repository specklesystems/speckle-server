<template>
  <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
  <div
    :class="`bg-foundation rounded-md hover:shadow-md shadow transition overflow-hidden ${
      modelCard.expired ? 'outline outline-blue-500/10' : ''
    }`"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="flex items-center h-20">
      <div class="flex items-center h-20 justify-between w-[90%] p-2">
        <slot></slot>
      </div>
      <div class="w-[10%]">
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-300"
          leave-to-class="opacity-0"
          leave-active-class="transition duration-300"
        >
          <FormButton
            v-if="hovered"
            key="highlight"
            v-tippy="'Highlight Objects'"
            size="sm"
            text
            hide-text
            :icon-left="EyeIcon"
            @click="showHighlight"
          />
        </Transition>
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-300"
          leave-to-class="opacity-0"
          leave-active-class="transition duration-300"
        >
          <FormButton
            v-if="hovered"
            key="removeModel"
            v-tippy="'Remove Model'"
            size="sm"
            text
            hide-text
            :icon-left="TrashIcon"
            @click="openRemoveCardDialog = true"
          />
        </Transition>
        <Transition
          enter-from-class="opacity-0"
          enter-active-class="transition duration-300"
          leave-to-class="opacity-0"
          leave-active-class="transition duration-300"
        >
          <FormButton
            v-if="hovered"
            key="showNotifications"
            v-tippy="'Show Notifications'"
            size="sm"
            text
            hide-text
            :icon-left="notificationsEnabled ? SolidBellAlertIcon : BellAlertIcon"
            @click="showNotifications"
          />
        </Transition>
      </div>
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
      :class="[
        props.modelCard.progress?.status === 'Cancelled'
          ? 'bg-red-500/10 text-danger'
          : 'bg-blue-500/10 text-primary',
        onProgress ? 'h-8 opacity-100' : 'h-0 opacity-0 py-0',
        'transition-[height,scale,opacity] overflow-hidden'
      ]"
    >
      <CommonLoadingProgressBar
        :loading="loading"
        :cancelled="props.modelCard.progress?.status === 'Cancelled'"
        :progress="
          props.modelCard.progress ? props.modelCard.progress.progress : undefined
        "
      />
      <div v-if="onProgress" class="text-xs px-2 pt-1">
        {{ progressBarText }}
      </div>
    </div>
    <!-- Card Notification -->
    <div v-for="notification in props.modelCard.notifications" :key="notification.id">
      <CommonModelNotification
        v-if="notification.visible"
        :key="notification.id"
        :notification="notification"
      />
    </div>
    <LayoutDialog v-model:open="openRemoveCardDialog">
      <FormButton @click="removeCard">Remove</FormButton>
      <!-- <RemoveCardDialog :model="modelCard" @close="openRemoveCardDialog = false" /> -->
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingProgressBar } from '@speckle/ui-components'
import {
  TrashIcon,
  ExclamationTriangleIcon,
  BellAlertIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import { BellAlertIcon as SolidBellAlertIcon } from '@heroicons/vue/24/solid'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { IModelCard } from '~~/lib/models/card'

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

// TODO: This is fragile, need to figure it out with better explicit parameters, or progress bar types etc..
const progressBarText = computed(() => {
  if (props.modelCard.progress?.status === undefined) {
    return 'Progressing'
  } else if (
    props.modelCard.progress?.status === 'Converting' ||
    props.modelCard.progress?.status === 'Constructing'
  ) {
    return `${props.modelCard.progress?.status} (% ${progressBarValue()})`
  } else {
    return props.modelCard.progress.status
  }
})

// TODO: This is fragile, need to figure it out with better explicit parameters, or progress bar types etc..
const loading = computed(() => progressBarText.value !== 'Progressing')

const removeCard = () => {
  store.removeModel(props.modelCard)
}

const showNotifications = () => {
  notificationsEnabled.value = !notificationsEnabled.value

  if (notificationsEnabled.value) {
    props.modelCard.notifications?.forEach((n) => (n.visible = true))
  } else {
    props.modelCard.notifications?.forEach((n) => (n.visible = false))
  }
}

const showHighlight = () => {
  store.highlightModel(props.modelCard.id)
}

const openRemoveCardDialog = ref(false)
const hovered = ref(false)
const notificationsEnabled = ref(false)
</script>

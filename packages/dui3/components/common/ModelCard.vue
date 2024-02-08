<template>
  <div
    :class="`rounded-md hover:shadow-md shadow transition overflow-hidden outline outline-blue-500/5 ${cardBgColor}`"
  >
    <div class="px-2">
      <slot></slot>
    </div>

    <!-- Progress state -->
    <div
      :class="[
        modelCard.progress ? 'h-9 opacity-100' : 'h-0 opacity-0 py-0',
        'transition-[height,scale,opacity] overflow-hidden bg-blue-500/10'
      ]"
    >
      <CommonLoadingProgressBar
        :loading="!!modelCard.progress"
        :cancelled="modelCard.progress?.status === 'Cancelled'"
        :progress="modelCard.progress ? modelCard.progress.progress : undefined"
      />
      <div class="text-xs font-bold px-2 h-full flex items-center text-primary">
        <span>
          {{ modelCard.progress?.status || '...' }}
          {{
            modelCard.progress?.progress
              ? ((props.modelCard.progress?.progress as number) * 100).toFixed() + '%'
              : ''
          }}
        </span>
      </div>
    </div>

    <!-- Card Notification -->
    <div>
      <CommonModelNotification
        v-for="(notification, index) in modelCard.notifications"
        :key="index"
        :index="index"
        :notification="notification"
        @dismiss="store.dismissModelNotification(modelCard.id, index)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { CommonLoadingProgressBar } from '@speckle/ui-components'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { IModelCard } from '~~/lib/models/card'

const store = useHostAppStore()

const props = defineProps<{
  modelCard: IModelCard
  project: ProjectModelGroup
}>()

const cardBgColor = computed(() => {
  if (!props.modelCard.notifications || props.modelCard.notifications?.length === 0)
    return 'bg-foundation-2'

  const notification = props.modelCard.notifications[0]
  switch (notification.level) {
    case 'danger':
      return 'bg-red-500/5'
    case 'info':
      return 'bg-blue-500/5'
    case 'success':
      return 'bg-green-500/5'
    case 'warning':
      return 'bg-orange-500/5'
  }
})
</script>

<template>
  <div
    :class="`${containerClassColor} text-body-3xs flex justify-between items-center py-1 px-2 space-x-2 max-[275px]:flex-col max-[275px]:space-y-2 min-w-0`"
  >
    <div class="grow min-w-0">
      <div
        :class="`${textClassColor} font-medium transition max-[275px]:text-center line-clamp-4 text-ellipsis break-words`"
      >
        {{ notification.text }}
      </div>
    </div>
    <div class="flex items-center group space-x-1">
      <FormButton
        v-if="notification.dismissible"
        size="xs"
        text
        :color="notification.level"
        @click.stop="$emit('dismiss')"
      >
        <span :class="`${textClassColor}`">Dismiss</span>
      </FormButton>
      <ReportBase
        v-if="notification.report"
        :report="notification.report"
        class="mt-[3px]"
      />
      <FormButton
        v-if="notification.cta"
        size="sm"
        :color="notification.level === 'info' ? 'primary' : notification.level"
        @click.stop="notification.cta?.action"
      >
        {{ notification.cta.name }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import type { ModelCardNotification } from '~/lib/models/card/notification'

const props = defineProps<{
  notification: ModelCardNotification
}>()

const emit = defineEmits(['dismiss'])

if (props.notification.timeout) {
  useTimeoutFn(() => emit('dismiss'), props.notification.timeout)
}

const containerClassColor = computed(() => {
  switch (props.notification.level) {
    case 'danger':
      return 'bg-red-500/10'
    case 'info':
      return 'bg-blue-500/10'
    case 'success':
      return 'bg-green-500/10'
    case 'warning':
      return 'bg-orange-500/10'
    default:
      return 'bg-blue-500/10'
  }
})

const textClassColor = computed(() => {
  switch (props.notification.level) {
    case 'danger':
      return 'text-red-500'
    case 'info':
      return 'text-blue-500'
    case 'success':
      return 'text-green-500'
    case 'warning':
      return 'text-orange-500'
    default:
      return 'bg-blue-500/10'
  }
})
</script>

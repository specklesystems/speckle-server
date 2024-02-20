<template>
  <div
    :class="`${containerClassColor} flex justify-between items-center py-2 px-2 space-x-2 max-[275px]:flex-col max-[275px]:space-y-2`"
  >
    <div class="grow">
      <div
        :class="`${textClassColor} text-xs font-medium transition max-[275px]:text-center`"
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
        @click="$emit('dismiss')"
      >
        <span :class="`${textClassColor}`">Dismiss</span>
      </FormButton>
      <FormButton
        v-if="notification.cta"
        size="sm"
        :color="notification.level === 'info' ? 'primary' : notification.level"
        @click="notification.cta?.action"
      >
        {{ notification.cta.name }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import { ModelCardNotification } from '~/lib/models/card/notification'

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
  }
})
</script>

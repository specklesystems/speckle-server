<template>
  <div class="bg-highlight-1 border-t border-t-highlight-3">
    <div class="flex">
      <div class="flex grow justify-between items-center py-2 pl-1 pr-1 min-w-0">
        <div class="grow w-full min-w-0 flex space-x-1 items-center">
          <ReportBase
            v-if="notification.report"
            :report="notification.report"
            class="mt-[3px]"
          />
          <div
            v-tippy="notification.text"
            :class="`${textClassColor} text-body-3xs transition line-clamp-1 text-ellipsis`"
          >
            {{ notification.text }}
          </div>
        </div>
        <div class="flex items-center group">
          <FormButton
            v-if="notification.cta"
            size="sm"
            :color="notification.level === 'info' ? 'outline' : notification.level"
            full-width
            @click.stop="notification.cta?.action"
          >
            {{ notification.cta.name }}
          </FormButton>
        </div>
      </div>
      <div
        v-if="notification.dismissible"
        class="flex items-center w-0 group-hover:w-5 transition-[width]"
      >
        <FormButton
          v-tippy="'Dismiss'"
          color="subtle"
          size="sm"
          :icon-left="XMarkIcon"
          hide-text
          :disabled="!notification.dismissible"
          @click.stop="$emit('dismiss')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core'
import type { ModelCardNotification } from '~/lib/models/card/notification'
import { XMarkIcon } from '@heroicons/vue/24/outline'
const props = defineProps<{
  notification: ModelCardNotification
}>()

const emit = defineEmits(['dismiss'])

if (props.notification.timeout) {
  useTimeoutFn(() => emit('dismiss'), props.notification.timeout)
}

const textClassColor = computed(() => {
  switch (props.notification.level) {
    case 'danger':
      return 'text-red-500'
    case 'info':
      return 'text-foreground-2'
    case 'success':
      return 'text-foreground-2'
    case 'warning':
      return 'text-foreground-2'
    default:
      return 'text-foreground-2'
  }
})
</script>

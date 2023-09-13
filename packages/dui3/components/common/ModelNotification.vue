<template>
  <div :class="container">
    <div :class="textColor">
      {{ props.notification.text }}
    </div>
    <div v-if="props.notification.action" class="p-1">
      <FormButton
        size="sm"
        :color="props.notification.type"
        @click="openWindow(props.notification.action.url)"
      >
        {{ props.notification.action.name }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToastInfo } from 'lib/bindings/definitions/IBasicConnectorBinding'

const props = defineProps<{
  notification: ToastInfo
}>()

const notification = reactive({
  type: props.notification.type,
  typeColors: {
    info: 'blue',
    success: 'green',
    warning: 'orange',
    danger: 'red'
  }
})

const computedNotificationType = computed(() => {
  return notification.typeColors[notification.type]
})

// FIXME: there is a weird styling state issue, that need to be fixed when the time arrives!
// For now not bothering, because it's MVP...
const container = computed(() => {
  return `flex justify-between bg-${computedNotificationType.value}-500/10 h-8 opacity-100`
})
const textColor = computed(() => {
  return `text-xs text-${computedNotificationType.value}-500 px-2 pt-2 font-medium`
})

const openWindow = (url: string) => {
  const app = useNuxtApp()
  app.$openUrl(url)
}
</script>

<template>
  <div :class="`flex justify-between bg-${background}-500/10 h-8 opacity-100`">
    <div :class="`text-xs text-${textColor}-500 px-2 pt-2 font-medium`">
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

const typeColors2 = {
  info: 'blue',
  success: 'success',
  warning: 'orange',
  danger: 'red'
}

const background = computed(() => {
  const typeColors = {
    info: 'blue',
    success: 'success',
    warning: 'orange',
    danger: 'red'
  }
  return typeColors[props.notification.type]
})
const textColor = computed(() => typeColors2[props.notification.type])

const openWindow = (url: string) => {
  const app = useNuxtApp()
  app.$openUrl(url)
}
</script>

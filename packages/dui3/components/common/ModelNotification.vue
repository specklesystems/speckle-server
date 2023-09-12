<template>
  <div :class="`flex justify-between bg-green-500/10 text-success h-8 opacity-100`">
    <div class="text-xs px-2 pt-2 font-medium">{{ props.notification.text }}</div>
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

const openWindow = (url: string) => {
  const app = useNuxtApp()
  app.$openUrl(url)
}
</script>

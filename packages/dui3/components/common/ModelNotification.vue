<template>
  <div :class="containerClass">
    <div :class="textClass">
      {{ props.notification.text }}
    </div>
    <div v-if="props.notification.action" class="p-1">
      <FormButton
        size="sm"
        :color="props.notification.level"
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

const containerClass = computed(() => {
  switch (props.notification.level) {
    case 'danger':
      return 'flex justify-between bg-red-500/10 h-8 opacity-100'
    case 'info':
      return 'flex justify-between bg-blue-500/10 h-8 opacity-100'
    case 'success':
      return 'flex justify-between bg-green-500/10 h-8 opacity-100'
    case 'warning':
      return 'flex justify-between bg-orange-500/10 h-8 opacity-100'
  }
})

const textClass = computed(() => {
  switch (props.notification.level) {
    case 'danger':
      return 'text-xs text-red-500 px-2 pt-2 font-medium'
    case 'info':
      return 'text-xs text-blue-500 px-2 pt-2 font-medium'
    case 'success':
      return 'text-xs text-green-500 px-2 pt-2 font-medium'
    case 'warning':
      return 'text-xs text-orange-500 px-2 pt-2 font-medium'
  }
})

// FIXME: there is a weird styling state issue if I use dynamic styling as before..
// It somehow doesn't work! That's why I used it as above with switch cases...

// const typeColors = {
//   info: 'blue',
//   success: 'green',
//   warning: 'orange',
//   danger: 'red'
// }
// const container = computed(() => {
//   return `flex justify-between bg-${
//     typeColors[props.notification.level]
//   }-500/10 h-8 opacity-100`
// })
// const textColor = computed(() => {
//   return `text-xs text-${
//     typeColors[props.notification.level]
//   }-500 px-2 pt-2 font-medium`
// })

const openWindow = (url: string) => {
  const app = useNuxtApp()
  app.$openUrl(url)
}
</script>

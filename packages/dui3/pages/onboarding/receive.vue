<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <div class="h3">{{ `Let's receive our first model to ${hostAppName}.` }}</div>
    <div class="h3">{{ `Let's receive our first model to host app.` }}</div>
  </div>
</template>

<script>
import { ref } from 'vue'

const app = useNuxtApp()
const hostAppName = ref('')
;async () => {
  hostAppName.value = await app.$baseBinding.getSourceApplicationName()
}

export { hostAppName }
</script>

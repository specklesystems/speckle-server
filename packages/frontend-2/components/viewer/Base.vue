<template>
  <div ref="rendererparent" class="absolute w-full h-full"></div>
</template>
<script setup lang="ts">
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'

const rendererparent = ref<HTMLElement>()
const {
  instance: viewer,
  container,
  init: { promise: isInitializedPromise }
} = useInjectedViewer()

onMounted(async () => {
  if (!import.meta.client) return

  await isInitializedPromise
  container.style.display = 'block'
  rendererparent.value?.appendChild(container)

  viewer.resize()
  // Not needed
  // viewer.cameraHandler.onWindowResize()
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  container.style.display = 'none'

  document.body.appendChild(container)
})
</script>

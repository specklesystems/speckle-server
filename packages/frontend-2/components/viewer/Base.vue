<template>
  <!-- TODO: Check if wrapping the parent of this shit in client only works -->
  <div ref="rendererparent" class="absolute w-full h-full"></div>
</template>
<script setup lang="ts">
import { Viewer } from '@speckle/viewer'
import { useInjectedViewer } from '~~/lib/viewer/composables/viewer'

let viewer: Viewer, container: HTMLElement, isInitializedPromise: Promise<boolean>
const rendererparent = ref<HTMLElement>()

const { viewer: v, container: c, isInitializedPromise: p } = useInjectedViewer()

if (process.client) {
  viewer = v
  container = c
  isInitializedPromise = p
  provide('viewer', viewer)
}

onMounted(async () => {
  if (!process.client) return

  await isInitializedPromise
  container.style.display = 'block'
  rendererparent.value?.appendChild(container)

  viewer.resize()
  viewer.cameraHandler.onWindowResize()
})

onBeforeUnmount(async () => {
  if (!process.client) return
  await viewer.unloadAll()
  container.style.display = 'none'
  document.body.appendChild(container)
})
</script>

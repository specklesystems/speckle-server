<template>
  <div
    ref="rendererparent"
    class="absolute w-full h-full"
    data-dd-action-name="Viewer Canvas"
  ></div>
</template>
<script setup lang="ts">
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import { useCommentContext } from '~~/lib/viewer/composables/commentManagement'
import { useViewModeUtilities } from '~/lib/viewer/composables/ui'

const rendererparent = ref<HTMLElement>()
const {
  instance: viewer,
  container,
  init: { promise: isInitializedPromise }
} = useInjectedViewer()

const { cleanupThreadContext } = useCommentContext()
const { resetViewMode } = useViewModeUtilities()

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
  cleanupThreadContext()
  resetViewMode()
  document.body.appendChild(container)
})
</script>

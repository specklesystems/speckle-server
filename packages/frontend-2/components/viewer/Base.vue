<template>
  <div
    ref="rendererparent"
    class="absolute w-full h-full"
    data-dd-action-name="Viewer Canvas"
  ></div>
</template>
<script setup lang="ts">
import { useInjectedViewer } from '~~/lib/viewer/composables/setup'
import { useResizeObserver } from '@vueuse/core'
import { debounce } from 'lodash-es'

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
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  container.style.display = 'none'
  document.body.appendChild(container)
})

useResizeObserver(
  rendererparent,
  debounce(() => {
    if (!import.meta.client) return
    viewer.resize()
  }, 500)
)
</script>

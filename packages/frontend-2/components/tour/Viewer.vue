<template>
  <div>
    <div ref="rendererparent" class="absolute h-screen w-screen special-gradient"></div>
    <div
      class="absolute h-screen w-screen z-10 pointer-events-none flex items-center justify-center"
    >
      <TourOnboarding />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Viewer } from '@speckle/viewer'
import { setupCommitObjectViewer } from '~~/lib/viewer/composables/viewer'
const rendererparent = ref<HTMLElement>()

let viewer: Viewer, container: HTMLElement, isInitializedPromise: Promise<boolean>

if (process.client) {
  const { viewer: v, container: c, isInitializedPromise: p } = setupCommitObjectViewer()
  viewer = v
  container = c
  isInitializedPromise = p
  provide('viewer', viewer)
}

onMounted(async () => {
  await isInitializedPromise
  rendererparent.value?.appendChild(container as HTMLElement)
  viewer.resize()
  viewer.cameraHandler.onWindowResize()
  await viewer.loadObject(
    'https://latest.speckle.dev/streams/b5cc4e967c/objects/b2d6668e1b1194e45d8bf4d638e61554'
  )
})
</script>
<style scoped>
.special-gradient {
  @apply bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-sky-400  to-indigo-900;

  /* @apply bg-gradient-to-tr dark:from-gray-700 dark:via-gray-900 dark:to-black from-gray-50 via-gray-200 to-foundation-2; */

  /* @apply bg-[conic-gradient(at_right,_var(--tw-gradient-stops))] from-indigo-200 via-slate-600 to-indigo-200; */

  /* @apply bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-sky-400 dark:from-blue-800 to-indigo-900 dark:to-zinc-900; */

  /* bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900 */

  /* @apply bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-200 via-violet-600 to-sky-900; */
}
</style>

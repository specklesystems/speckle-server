<template>
  <div class="special-gradient absolute w-screen h-screen">
    <ViewerBase />
  </div>

  <div
    class="absolute h-screen w-screen z-10 pointer-events-none flex items-center justify-center"
  >
    <TourOnboarding />
  </div>
</template>
<script setup lang="ts">
import { setupViewer } from '~~/lib/viewer/composables/viewer'
const { viewer } = setupViewer()

onMounted(async () => {
  await viewer.loadObject(
    'https://latest.speckle.dev/streams/b5cc4e967c/objects/b2d6668e1b1194e45d8bf4d638e61554'
  )
})

onBeforeUnmount(async () => {
  await viewer.unloadAll()
})

definePageMeta({
  pageTransition: false,
  layoutTransition: false
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

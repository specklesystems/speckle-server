<template>
  <div>
    <div
      ref="rendererparent"
      class="absolute special-gradient h-screen w-screen special-gradient"
    ></div>
    <!-- <TourSlideshow /> -->
    <div
      class="absolute h-screen w-screen z-10 pointer-events-none flex items-center justify-center"
    >
      <div class="pointer-events-auto max-w-xl">
        <TourOnboarding />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { getOrInitViewer } from '@/lib/viewer/composables/viewer'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { ArrowRightIcon } from '@heroicons/vue/24/solid'
const rendererparent = ref<HTMLElement>()

const { activeUser } = useActiveUser()
const { container, viewer } = await getOrInitViewer()

provide('viewer', viewer)

onMounted(async () => {
  rendererparent.value?.appendChild(container as HTMLElement)
  viewer.resize()
  viewer.cameraHandler.onWindowResize()
  await viewer.loadObject(
    // 'https://latest.speckle.dev/streams/b5cc4e967c/objects/6d1be6614c268d3a4a4b3b349486fda3'
    // 'https://latest.speckle.dev/streams/83306dd91a/objects/8a04e7d17bd588d43c1bb336db639951'
    // 'https://latest.speckle.dev/streams/b5cc4e967c/objects/71ee1c07d9a1140b29c3f38df3f5fd1c'
    'https://latest.speckle.dev/streams/b5cc4e967c/objects/b2d6668e1b1194e45d8bf4d638e61554'
  )

  viewer.cameraHandler.controls.addEventListener('update', () => {
    const cam = viewer.cameraHandler.camera.position
  })
})
</script>
<style scoped>
.special-gradient {
  /* @apply bg-gradient-to-tr dark:from-gray-700 dark:via-gray-900 dark:to-black from-gray-50 via-gray-200 to-foundation-2; */
  /* @apply bg-[conic-gradient(at_right,_var(--tw-gradient-stops))] from-indigo-200 via-slate-600 to-indigo-200; */

  @apply bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-sky-400 dark:from-blue-800 to-indigo-900 dark:to-zinc-900;
  /* bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-blue-700 via-blue-800 to-gray-900 */
  /* @apply bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-200 via-violet-600 to-sky-900; */
}
</style>

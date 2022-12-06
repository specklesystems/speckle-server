<template>
  <div
    ref="rendererparent"
    class="absolute special-gradient h-screen w-screen special-gradient"
  ></div>
  <TourSlideshow />
  <div
    class="absolute h-screen w-screen z-10 pointer-events-none flex items-center justify-center"
  >
    <!-- <div class="bg-foundation rounded-xl p-10 shadow-xl pointer-events-auto">
      <h2 class="text-2xl font-bold">
        Welcome to Speckle, {{ activeUser?.name?.split(' ')[0] }}!
      </h2>
      <div class="flex justify-between mt-10">
        <div class="text-gray-500">Skip Tour</div>
        <div><FormButton>Let's explore!</FormButton></div>
      </div>
    </div> -->
  </div>
</template>
<script setup lang="ts">
import { getOrInitViewer } from '@/lib/viewer/composables/viewer'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const rendererparent = ref<HTMLElement>()

const { activeUser } = useActiveUser()
const { container, viewer } = await getOrInitViewer()
provide('viewer', viewer)

onMounted(async () => {
  rendererparent.value?.appendChild(container as HTMLElement)
  viewer.resize()
  viewer.cameraHandler.onWindowResize()
  await viewer.loadObject(
    'https://latest.speckle.dev/streams/b5cc4e967c/objects/71ee1c07d9a1140b29c3f38df3f5fd1c'
  )
})
</script>
<style scoped>
.special-gradient {
  @apply bg-gradient-to-tr dark:from-gray-700 dark:via-gray-900 dark:to-black from-gray-50 via-gray-200 to-foundation-2;
  /* @apply bg-[conic-gradient(at_right,_var(--tw-gradient-stops))] from-indigo-200 via-slate-600 to-indigo-200; */
  /* @apply bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-200 via-violet-600 to-sky-900; */
}
</style>

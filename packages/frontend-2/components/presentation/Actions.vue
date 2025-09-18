<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md h-10 flex items-center"
  >
    <div class="flex items-center justify-between md:space-x-1 p-1">
      <FormButton class="hidden md:flex">Share</FormButton>

      <PresentationFloatingPanelButton class="hidden md:flex" @click="toggleFullscreen">
        <LucideFullscreen class="size-4" />
      </PresentationFloatingPanelButton>

      <PresentationFloatingPanelButton
        :is-active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideInfo class="size-4" />
      </PresentationFloatingPanelButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LucideInfo, LucideFullscreen } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

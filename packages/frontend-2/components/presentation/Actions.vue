<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md h-10 flex items-center"
  >
    <div class="flex items-center justify-between space-x-1 p-1">
      <FormButton
        v-if="!isPresentMode"
        :icon-left="LucidePlay"
        @click="emit('togglePresentMode')"
      >
        Present
      </FormButton>
      <PresentationFloatingPanelButton v-if="isPresentMode" @click="toggleFullscreen">
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
import { LucideInfo, LucideFullscreen, LucidePlay } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
  (e: 'togglePresentMode'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
const isPresentMode = defineModel<boolean>('is-present-mode')

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
</script>

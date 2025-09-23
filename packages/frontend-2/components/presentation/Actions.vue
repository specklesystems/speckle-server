<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md flex items-center h-10"
  >
    <div class="flex items-center justify-between space-x-1 p-1">
      <FormButton>Share</FormButton>

      <PresentationFloatingPanelButton
        class="hidden md:flex touch:hidden"
        @click="toggleFullscreen"
      >
        <LucideMinimize
          v-if="isFullscreen"
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
        <LucideMaximize
          v-else
          :size="16"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
        />
      </PresentationFloatingPanelButton>

      <PresentationFloatingPanelButton
        :is-active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideInfo :size="16" :stroke-width="1.5" :absolute-stroke-width="true" />
      </PresentationFloatingPanelButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LucideInfo, LucideMaximize, LucideMinimize } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')

const isFullscreen = ref(false)

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// Listen for fullscreen changes
onMounted(() => {
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  })
})
</script>

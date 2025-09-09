<template>
  <PresentationFloatingPanel>
    <div class="flex items-center justify-between space-x-2 pr-1">
      <PresentationFloatingPanelButton
        :active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <ChevronLeft v-if="isSidebarOpen" class="size-5" />
        <ChevronRight v-else class="size-5" />
      </PresentationFloatingPanelButton>
      <h1 v-if="title" class="text-body-xs font-medium text-foreground leading-none">
        {{ title }}
      </h1>
    </div>
  </PresentationFloatingPanel>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

defineProps<{
  title: MaybeNullOrUndefined<string>
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
</script>

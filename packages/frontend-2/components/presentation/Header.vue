<template>
  <PresentationFloatingPanel>
    <div
      class="flex items-center justify-between space-x-1 md:pr-1"
      :class="[isSidebarOpen ? '' : 'pr-1']"
    >
      <PresentationFloatingPanelButton
        :active="isSidebarOpen"
        @click="emit('toggleSidebar')"
      >
        <LucideArrowLeftToLine v-if="isSidebarOpen" class="size-4" />
        <LucidePanelLeft v-else class="size-4" />
      </PresentationFloatingPanelButton>
      <h1
        v-if="title"
        class="text-body-xs font-medium text-foreground leading-none"
        :class="{ 'hidden md:block': isSidebarOpen }"
      >
        {{ title }}
      </h1>
    </div>
  </PresentationFloatingPanel>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { LucideArrowLeftToLine, LucidePanelLeft } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

defineProps<{
  title: MaybeNullOrUndefined<string>
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
</script>

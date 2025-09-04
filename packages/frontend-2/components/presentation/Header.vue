<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl py-3 pl-1 pr-4 shadow-md h-10 flex items-center"
  >
    <div class="flex items-center justify-between space-x-2">
      <button
        class="size-8 flex items-center justify-center bg-foundation rounded-xl hover:bg-info-lighter hover:text-primary-focus"
        :class="{ 'bg-info-lighter text-primary-focus': isSidebarOpen }"
        @click="emit('toggleSidebar')"
      >
        <IconSidebar v-if="!isSidebarOpen" class="size-4" />
        <IconSidebarClose v-else class="size-4" />
      </button>
      <h1 v-if="title" class="text-body-xs font-medium text-foreground leading-none">
        {{ title }}
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

defineProps<{
  title: MaybeNullOrUndefined<string>
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
</script>

<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl shadow-md h-10 flex items-center"
  >
    <div class="flex items-center justify-between space-x-4 p-1">
      <button
        class="size-8 flex items-center justify-center bg-foundation rounded-xl hover:bg-info-lighter hover:text-primary-focus"
        :class="{ 'bg-info-lighter text-primary-focus': isSidebarOpen }"
        @click="emit('toggleSidebar')"
      >
        <LucideInfo class="size-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LucideInfo } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'toggleSidebar'): void
}>()

const isSidebarOpen = defineModel<boolean>('is-sidebar-open')
</script>

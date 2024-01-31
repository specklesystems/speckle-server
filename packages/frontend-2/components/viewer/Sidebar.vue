<template>
  <div
    class="absolute z-10 right-0 h-[100dvh] bg-foundation simple-scrollbar overflow-y-auto transition pt-32 shadow-lg"
    :class="isExpanded ? 'w-96' : 'w-72'"
  >
    <!-- Header -->
    <div
      class="fixed z-10 top-14 right-0 w-72 h-10 px-2 border-b border-outline-3 flex items-center justify-between font-bold text-sm text-primary bg-foundation"
      :class="isExpanded ? 'w-96' : 'w-72'"
    >
      <slot name="title"></slot>
      <div class="flex items-center gap-0.5">
        <button
          class="p-1 text-foreground hover:text-primary"
          @click="isExpanded = !isExpanded"
        >
          <ChevronDoubleRightIcon
            class="h-4 w-4 transition"
            :class="isExpanded ? '' : 'rotate-180'"
          />
        </button>
        <button class="p-0.5 text-foreground hover:text-primary">
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>
    <!-- Actions -->
    <div class="fixed z-10 top-24 w-full px-3 h-8 shadow-md bg-foundation">
      <div class="flex items-center gap-1 h-full">
        <slot name="actions"></slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon, ChevronDoubleRightIcon } from '@heroicons/vue/24/solid'
// const isOpen = defineModel<boolean>('open', { required: true })
const isExpanded = ref(false)
</script>

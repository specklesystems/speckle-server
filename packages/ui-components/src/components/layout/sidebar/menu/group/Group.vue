<template>
  <div class="flex flex-col">
    <div v-if="title" class="select-none mb-1">
      <button
        v-if="collapsible"
        class="group flex gap-1.5 items-center w-full hover:bg-foundation-3 rounded-md p-0.5"
        @click="isOpen = !isOpen"
      >
        <ChevronDownIcon :class="isOpen ? '' : 'rotate-180'" class="h-2.5 w-2.5" />
        <h6 class="font-bold text-foreground-2 text-xs flex items-center gap-1.5">
          {{ title }}
        </h6>
      </button>
      <div v-else class="flex gap-1 items-center w-full p-0.5 text-foreground-2">
        <div
          v-if="$slots['title-icon']"
          class="h-5 w-5 flex items-center justify-center"
        >
          <slot name="title-icon"></slot>
        </div>
        <h6 class="font-bold text-xs">
          {{ title }}
        </h6>
      </div>
    </div>

    <div v-show="isOpen" class="flex flex-col">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'

defineProps<{
  title?: string
  collapsible?: boolean
}>()

const isOpen = ref(true)
</script>

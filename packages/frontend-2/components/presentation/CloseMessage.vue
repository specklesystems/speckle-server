<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showCloseMessage"
      class="bg-black items-center rounded-lg text-white py-1.5 px-4 text-body-xs h-10 flex gap-x-3"
    >
      <span
        class="inline-block border border-white text-body-3xs rounded-md px-1 py-0.5"
      >
        ESC
      </span>
      to exit presentation
      <LucideX class="size-4 cursor-pointer" @click="onHideCloseMessage" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { LucideX } from 'lucide-vue-next'

defineEmits<{
  (e: 'hideCloseMessage'): void
}>()

defineProps<{
  showCloseMessage: boolean
}>()
</script>

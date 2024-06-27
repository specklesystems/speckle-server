<template>
  <aside
    class="absolute z-40 top-0 md:left-0 md:relative h-full flex flex-col justify-between w-64 md:w-80 bg-foundation-2 border-r border-outline-3 overflow-x-visible overflow-y-auto p-4 transition-all duration-200 shadow-md md:shadow-none simple-scrollbar"
    :class="isOpen ? 'left-0' : '-left-64 '"
  >
    <button
      class="md:hidden absolute top-4 -right-12 bg-foundation p-2 rounded border border-outline-3 shadow"
      @click="isOpen = !isOpen"
    >
      <Bars3Icon v-if="!isOpen" class="h-4 w-4" />
      <XMarkIcon v-else class="h-4 w-4" />
    </button>

    <button
      v-if="exitButtonText"
      class="flex items-center gap-1.5 text-sm font-semibold mb-4 max-w-max"
      @click="handleExitButtonClick"
    >
      <ChevronLeftIcon class="size-3" />
      {{ exitButtonText }}
    </button>

    <slot></slot>
  </aside>
</template>

<script setup lang="ts">
import { Bars3Icon, XMarkIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  exitButtonText?: string
  onExitButtonClick?: () => void
}>()

const isOpen = ref(false)

const handleExitButtonClick = () => {
  if (typeof props.onExitButtonClick === 'function') {
    props.onExitButtonClick()
  }
}
</script>

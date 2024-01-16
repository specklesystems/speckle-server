<template>
  <div
    class="flex sm:w-auto h-8 sm:h-auto"
    :class="isExpanded ? 'w-auto' : 'overflow-hidden w-8'"
  >
    <ViewerControlsButtonToggle
      class="sm:hidden mr-1"
      :active="isExpanded"
      @click="toggleSubMenu"
    >
      <EllipsisHorizontalIcon class="h-4 w-4 sm:h-5 sm:w-5" />
    </ViewerControlsButtonToggle>
    <button
      :class="`bg-foundation text-foreground shadow-md rounded-lg flex flex-col justify-center gap-1 py-1`"
    >
      <slot></slot>
    </button>
  </div>
</template>
<script setup lang="ts">
import { EllipsisHorizontalIcon } from '@heroicons/vue/20/solid'

const isExpanded = ref(false)

const toggleSubMenu = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div
    class="text-foreground hover:text-primary-focus transition truncate flex gap-1 items-center"
  >
    <div v-if="separator">
      <svg
        width="8"
        height="24"
        viewBox="0 0 8 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="text-outline-2"
      >
        <path d="M2 18L6 6" stroke="currentColor" />
      </svg>
    </div>
    <NuxtLink
      :to="to"
      class="flex gap-1 items-center text-body-xs ml-0.5 text-foreground-2"
      active-class="group is-active !text-foreground"
    >
      <div class="truncate">
        {{ name || to }}
      </div>
      <ChevronDownIcon v-if="!hideChevron" class="h3 w-3" />
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

defineProps({
  separator: {
    type: Boolean,
    default: true
  },
  hideChevron: {
    type: Boolean,
    default: false
  },
  to: {
    type: String,
    default: '/'
  },
  name: {
    type: String,
    default: null
  }
})
</script>

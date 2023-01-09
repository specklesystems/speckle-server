<template>
  <button
    :class="`${
      active ? 'bg-primary text-foreground-on-primary' : 'bg-foundation text-foreground'
    } transition shadow-md rounded-full w-10 h-10 flex items-center justify-center`"
  >
    <!-- <slot v-if="!active">test</slot>
    <XMarkIcon v-else class="w-5 h-5" /> -->
    <slot></slot>
  </button>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  active: boolean
}>()
</script>

<template>
  <li
    class="flex items-center text-body-xs"
    :class="{
      'lg:hidden': !isIncluded
    }"
  >
    <IconCheck v-if="isIncluded" class="w-4 h-4 text-foreground mx-2" />
    <XMarkIcon v-else class="w-4 h-4 mx-2 text-foreground-3" />
    <span
      v-tippy="description"
      class="underline decoration-outline-5 decoration-dashed underline-offset-4 cursor-help"
      :class="{
        'text-foreground-2': !isIncluded
      }"
    >
      {{ displayName }}
    </span>
  </li>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
defineProps<{
  displayName: string
  description: string
  isIncluded: boolean
}>()
</script>

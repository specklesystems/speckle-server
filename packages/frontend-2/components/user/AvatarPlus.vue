<template>
  <NuxtLink
    class="shrink-0 w-8 h-8 rounded-full border-2 border-outline-1 inline-flex justify-center items-center cursor-pointer"
    @click="$emit('click', $event)"
  >
    <PlusIcon class="w-4 h-4 text-primary" />
  </NuxtLink>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'

defineEmits<{
  (e: 'click', v: MouseEvent): void
}>()
</script>

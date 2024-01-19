<template>
  <button
    class="group flex items-center justify-center absolute inset-0"
    @click="$emit('play')"
  >
    <div class="absolute inset-0">
      <!-- <PreviewImage :preview-url="version.previewUrl" /> -->
    </div>
    <div
      class="group-hover:scale-110 group-hover:shadow-xl shadow h-14 w-14 rounded-full border border-foundation bg-primary flex items-center justify-center transition"
    >
      <PlayIcon class="h-6 w-6 ml-[3px] text-foundation" />
    </div>
    <div class="absolute bottom-2 right-0 scale-75">
      <HeaderLogoBlock powered-by />
    </div>
  </button>
</template>

<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/20/solid'

defineEmits<{
  (e: 'play'): void
}>()
</script>

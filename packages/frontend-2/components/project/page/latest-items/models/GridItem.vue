<template>
  <div class="h-52 rounded-lg bg-foundation-2 shadow flex flex-col">
    <!-- Image -->
    <div
      class="grow bg-contain bg-no-repeat bg-center"
      :style="{ backgroundImage: `url('${previewUrl}')` }"
    />
    <!-- Footer -->
    <div class="py-3 px-2 flex justify-between items-center">
      <div class="text-foreground normal">Model title</div>
      <div class="text-foreground-2 caption inline-flex items-center space-x-1">
        <ArrowPathRoundedSquareIcon class="h-4 w-4" />
        <span>1</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ArrowPathRoundedSquareIcon } from '@heroicons/vue/24/solid'

const previewUrl = ref(
  'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70'
)
</script>

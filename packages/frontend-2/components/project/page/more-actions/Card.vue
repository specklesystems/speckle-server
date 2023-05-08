<template>
  <div
    class="flex items-center min-h-[120px] py-3 px-4 bg-foundation rounded-lg shadow hover:shadow-md ring-outline-2 hover:ring-2"
  >
    <div class="grow h-full flex flex-col space-y-1">
      <div class="text-foreground h4 font-extrabold"><slot name="title" /></div>
      <div class="text-foreground-2 label label--light">
        <slot name="description" />
      </div>
    </div>
    <ChevronRightIcon class="shrink-0 h-6 w-6" />
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
</script>

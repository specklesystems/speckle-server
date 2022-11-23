<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="my-6 sm:mb-14" />
    <div class="w-full grid grid-cols-12 gap-8">
      <div class="col-span-2" />
      <LayoutPanel class="col-span-8">TEST 8-COL COLUMN</LayoutPanel>
      <div class="col-span-2" />
    </div>
  </div>
</template>
<script setup lang="ts">
/**
 * CSS Grid test
 */

definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})
</script>

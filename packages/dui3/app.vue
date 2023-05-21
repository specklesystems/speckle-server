<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
useHead({
  // Title suffix
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} - Speckle DUIv3` : 'Speckle DUIv3',
  htmlAttrs: {
    lang: 'en'
  },
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  }
})
</script>

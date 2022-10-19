<template>
  <div id="speckle" class="bg-background">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle')
})
</script>
<style>
/* stylelint-disable selector-id-pattern */

/**
 * Making sure page is always stretched to the bottom of the screen even if there's nothing in it
 */
html,
body,
body > div:first-child,
div#__nuxt,
div#__nuxt > div {
  height: 100%;
}
</style>

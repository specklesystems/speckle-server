<template>
  <div id="speckle" class="background-base">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
const darkMode = useCookie('darkMode')

useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle'),
  // Dark mode FOUC prevention
  htmlAttrs: { class: darkMode.value ? 'dark' : '' }
})
</script>

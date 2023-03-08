<template>
  <div>
    <ClientOnly>
      <TourViewer v-if="false" />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  title: 'Onboarding Tour',
  layout: 'fullscreen'
})
</script>

<template>
  <div>
    <ClientOnly>
      <TourViewer />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  title: 'Onboarding Tour',
  layout: 'fullscreen'
})
</script>

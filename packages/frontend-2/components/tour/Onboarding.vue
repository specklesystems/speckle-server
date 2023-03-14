<template>
  <div class="max-w-xl w-screen h-screen flex items-center justify-center">
    <TourSegmentation v-if="step === 0" @next="step++" />
    <TourSlideshow v-if="step === 1" @next="step++" />
    <TourManager v-if="step === 2" @next="step++" />
  </div>
</template>
<script setup lang="ts">
const step = ref(0)
</script>

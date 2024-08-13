<template>
  <NuxtLink class="flex items-center" to="/">
    <img
      class="block h-6 w-6"
      :class="{ 'mr-2': !minimal, grayscale: active }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />
    <div
      v-if="!minimal"
      class="text-foreground mt-0 hidden font-bold text-body-sm md:flex"
    >
      Speckle
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps({
  minimal: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
})
</script>

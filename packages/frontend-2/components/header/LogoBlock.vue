<template>
  <NuxtLink class="flex items-center" to="/">
    <img
      class="block h-6"
      :class="{ 'mr-2': !minimal, grayscale: active }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />
    <div v-if="!minimal" class="text-blue-500 mt-0 h6 font-bold">Speckle</div>
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

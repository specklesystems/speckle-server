<template>
  <NuxtLink class="flex items-center" to="/">
    <img
      class="block h-8"
      :class="{ 'mr-2': !minimal }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />
    <div v-if="!minimal" class="text-2xl text-primary-lighter font-bold">Speckle</div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps({
  minimal: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <NuxtLink class="flex items-center" to="/">
    <img
      class="block h-8 w-8"
      src="~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />
    <div v-if="!minimal" class="text-primary h6 mt-0 font-bold leading-7 md:flex">
      Solid Broccoli
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

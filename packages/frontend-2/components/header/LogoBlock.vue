<template>
  <NuxtLink class="flex items-center shrink-0" :to="to">
    <img
      class="block"
      :class="{
        grayscale: active,
        'h-6 w-6': !largeIcon,
        'h-10 w-10': largeIcon
      }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />

    <div
      v-if="!minimal"
      class="text-primary h6 mt-0 font-bold leading-7"
      :class="showTextOnMobile ? '' : 'hidden md:flex'"
    >
      Speckle
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  minimal?: boolean
  active?: boolean
  to?: string
  largeIcon?: boolean
  showTextOnMobile?: boolean
}>()
</script>

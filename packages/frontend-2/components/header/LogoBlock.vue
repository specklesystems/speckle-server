<template>
  <NuxtLink class="flex items-center shrink-0" :to="to" :target="target">
    <img
      class="h-8 w-8 block"
      :class="{
        grayscale: active
      }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />

    <div
      v-if="!minimal"
      class="text-primary text-base mt-0 font-bold leading-7"
      :class="showTextOnMobile ? '' : 'hidden md:flex'"
    >
      Speckle
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    minimal?: boolean
    active?: boolean
    to?: string
    showTextOnMobile?: boolean
    target?: string
  }>(),
  {
    active: true,
    to: '/'
  }
)
</script>

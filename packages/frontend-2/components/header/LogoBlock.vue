<template>
  <NuxtLink
    class="flex items-center shrink-0 gap-1"
    :to="poweredBy ? 'https://speckle.systems/' : '/'"
    :target="poweredBy ? '_blank' : undefined"
  >
    <img
      class="block"
      :class="{
        grayscale: active && !poweredBy,
        'h-8 w-8': poweredBy,
        'h-6 w-6': !poweredBy
      }"
      src="~~/assets/images/speckle_logo_big.png"
      alt="Speckle"
    />

    <div
      v-if="!minimal && !poweredBy"
      class="text-primary h6 mt-0 hidden font-bold leading-7 md:flex"
    >
      Speckle
    </div>
    <div v-if="poweredBy" class="text-xs font-bold text-primary">
      Powered by Speckle
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
  },
  poweredBy: {
    type: Boolean,
    default: false
  }
})
</script>

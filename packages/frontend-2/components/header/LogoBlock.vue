<template>
  <Component
    :is="mainComponent"
    class="flex items-center shrink-0"
    :to="to"
    :target="target"
  >
    <img
      class="h-8 w-8 block"
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
  </Component>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    minimal?: boolean
    to?: string
    showTextOnMobile?: boolean
    target?: string
    noLink?: boolean
  }>(),
  {
    to: '/'
  }
)

const NuxtLink = resolveComponent('NuxtLink')
const mainComponent = computed(() => (props.noLink ? 'div' : NuxtLink))
</script>

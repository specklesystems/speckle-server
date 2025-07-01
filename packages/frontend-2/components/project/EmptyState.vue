<template>
  <div
    class="w-full flex justify-center items-center p-20 gap-8 text-balance flex-col text-center"
  >
    <slot name="illustration"></slot>
    <div>
      <p class="text-foreground-2 text-heading-sm p-0 m-0">
        {{ title }}
      </p>
      <p v-if="text" class="text-body-xs max-w-xs mx-auto text-foreground-2 mt-2 p-0">
        {{ text }}
      </p>
      <div class="w-full flex flex-row justify-center max-w-xs mx-auto mt-3 flex-wrap">
        <slot name="cta"></slot>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  text?: string
}>()
</script>

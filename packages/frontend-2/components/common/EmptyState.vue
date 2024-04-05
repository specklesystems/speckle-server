<template>
  <div class="flex flex-col space-y-2 items-center justify-center p-4">
    <img src="~~/assets/images/boxes/empty.png" alt="No data found" class="h-32" />
    <div class="text-sm">
      <slot>No data found!</slot>
    </div>
    <FormButton v-if="cta" size="sm" :to="cta?.to" @click="cta?.onClick || noop">
      {{ cta.text }}
    </FormButton>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  cta?: {
    text: string
    onClick?: (e: MouseEvent) => void
    to?: string
  }
}>()
</script>

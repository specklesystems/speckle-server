<template>
  <FormButton
    color="outline"
    size="lg"
    full-width
    class="group"
    :to="to"
    :link-component="NuxtLink"
  >
    <div class="flex items-center justify-center">
      <slot />
    </div>
  </FormButton>
</template>

<script setup lang="ts">
const NuxtLink = resolveComponent('NuxtLink')

defineProps<{
  to: string
}>()
</script>

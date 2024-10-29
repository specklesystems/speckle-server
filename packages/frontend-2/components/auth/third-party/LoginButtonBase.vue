<template>
  <NuxtLink :to="to" class="group">
    <FormButton color="outline" size="lg" full-width>
      <div class="flex items-center justify-center">
        <slot />
      </div>
    </FormButton>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  to: string
  noVerticalPadding?: boolean
}>()
</script>

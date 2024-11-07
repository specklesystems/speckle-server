<template>
  <NuxtLink :to="to">
    <FormButton color="outline" size="lg" full-width class="group">
      <div class="flex items-center justify-center">
        <slot />
      </div>
    </FormButton>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>

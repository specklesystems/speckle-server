<template>
  <div class="flex flex-col">
    <h2 class="text-heading">{{ title }}</h2>
    <p class="text-body-sm text-foreground-2 line-clamp-2">
      {{ description ? description : 'No description' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'

defineProps<{
  title: string
  description?: Nullable<string>
}>()
</script>

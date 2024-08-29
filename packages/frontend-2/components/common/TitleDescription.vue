<template>
  <div class="flex flex-col gap-1">
    <h2 class="text-heading">{{ title }}</h2>
    <p class="text-body-sm text-foreground-2">
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

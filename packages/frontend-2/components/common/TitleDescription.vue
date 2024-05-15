<template>
  <div class="flex flex-col gap-2">
    <h2 class="h3">{{ title }}</h2>
    <p v-if="description" class="text-foreground-2">{{ description }}</p>
    <p v-else class="text-foreground-2 italic select-none">No description</p>
  </div>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'

defineProps<{
  title: string
  description?: Nullable<string>
}>()
</script>

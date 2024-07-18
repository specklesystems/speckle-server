<template>
  <div class="flex flex-col gap-2">
    <h2 class="text-heading-xl">{{ title }}</h2>
    <p v-if="description" class="text-body text-foreground-2">{{ description }}</p>
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

<template>
  <div class="flex flex-col gap-1">
    <h2 class="text-heading-xl">{{ title }}</h2>
    <p v-if="description" class="text-body-sm text-foreground-2">{{ description }}</p>
    <p v-else class="text-body-sm text-foreground-2 italic select-none">
      No description
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

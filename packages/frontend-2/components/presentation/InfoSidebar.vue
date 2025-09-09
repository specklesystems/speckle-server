<template>
  <aside class="bg-foundation h-screen w-80 border-l border-outline-3 py-5 px-4">
    <section class="pt-2 flex flex-col gap-4">
      <div v-if="title" class="px-2">
        <h1 class="text-xl font-medium text-foreground">{{ title }}</h1>
      </div>

      <div v-if="description" class="px-2">
        <p class="text-body-sm text-foreground whitespace-pre-wrap">
          {{ description }}
        </p>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  title: MaybeNullOrUndefined<string>
  description: MaybeNullOrUndefined<string>
}>()
</script>

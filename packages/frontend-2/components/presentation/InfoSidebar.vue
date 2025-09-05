<template>
  <aside class="bg-foundation h-screen w-80 border-l border-outline-3 py-5 px-4">
    <section class="pt-2 px-3 flex flex-col gap-4">
      <h2 v-if="title" class="text-heading-xl font-medium text-foreground">
        {{ title }}
      </h2>
      <p class="text-body-sm text-foreground">
        The architectural team models the room geometry with paper, and uses the laser
        scanner to generate a hi res mesh.
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  title: MaybeNullOrUndefined<string>
}>()
</script>

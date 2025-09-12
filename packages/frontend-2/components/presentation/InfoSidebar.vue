<template>
  <aside
    class="bg-foundation h-48 md:h-screen w-full md:w-80 border-t md:border-t-0 md:border-l border-outline-3 py-5 px-4"
  >
    <section class="pt-2 flex flex-col gap-4">
      <div class="px-2">
        <h1 v-if="title" class="text-xl font-medium text-foreground">
          {{ title }}
        </h1>
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

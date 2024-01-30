<template>
  <ClientOnly>
    <div
      v-if="embedOptions.isEnabled"
      class="select-none fixed bottom-0 left-0 w-full z-20 flex gap-3 px-4 h-14 items-center"
      :class="embedOptions.isTransparent ? 'bg-transparent' : 'bg-foundation shadow-t'"
    >
      <NuxtLink href="https://speckle.systems/" target="_blank">
        <HeaderLogoBlock large-icon to="https://speckle.systems/" />
      </NuxtLink>
      <div class="h-6 w-px bg-primary"></div>
      <div class="flex flex-col">
        <NuxtLink :to="url" target="_blank" class="leading-3">
          <div class="flex items-center gap-1 w-full">
            <h2 class="font-bold text-base text-sm truncate">
              {{ name }}
            </h2>
            <ArrowTopRightOnSquareIcon class="h-3 w-3" />
          </div>
          <span v-if="date" class="text-xs text-foreground-2">
            {{ date }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'

import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

defineProps<{
  date?: string
  name?: string
  url?: string
}>()

const { embedOptions } = useEmbedState()
</script>

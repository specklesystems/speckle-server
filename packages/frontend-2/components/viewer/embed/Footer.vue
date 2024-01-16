<template>
  <div
    v-if="embedOptions.isEnabled"
    class="select-none fixed bottom-0 left-0 w-full z-20 flex"
    :class="
      embedOptions.isTransparent
        ? 'justify-end'
        : 'items-center gap-4 bg-foundation px-3 py-2'
    "
  >
    <NuxtLink href="https://speckle.systems/" target="_blank">
      <HeaderLogoBlock
        powered-by
        :class="embedOptions.isTransparent ? 'scale-75' : ''"
      />
    </NuxtLink>
    <div v-if="!embedOptions.isTransparent" class="h-6 w-px bg-primary"></div>
    <div v-if="!embedOptions.isTransparent" class="flex flex-col">
      <NuxtLink :to="projectUrl" target="_blank">
        <div class="flex items-center gap-1 -mb-1.5">
          <h2 class="font-bold text-base text-sm">
            {{ projectName }}
          </h2>
          <ArrowTopRightOnSquareIcon class="h-3 w-3" />
        </div>
        <span class="text-xs text-foreground-2">Created {{ projectCreatedAt }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'

import { useEmbedState } from '~~/lib/viewer/composables/setup/embed'

defineProps<{
  projectCreatedAt?: string
  projectName?: string
  projectUrl?: string
}>()

const { embedOptions } = useEmbedState()
</script>

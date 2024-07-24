<template>
  <div class="bg-foundation-2 flex gap-2 py-2 px-4">
    <EyeIcon
      v-tippy="'Currently viewing'"
      class="h-4 w-4 text-primary mt-0_5 focus:outline-0 shrink-0"
    />
    <div class="flex flex-col overflow-hidden text-xs select-none">
      <div class="inline-block rounded-full font-medium truncate">
        {{ version.sourceApplication }}
      </div>
      <div class="truncate text-foreground opacity-80">
        {{ version.message || 'no message' }}
      </div>
      <div
        v-tippy="createdAt.full"
        class="italic text-foreground opacity-60 inline-block"
      >
        {{ createdAt.relative }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon } from '@heroicons/vue/24/solid'

interface Version {
  sourceApplication?: string | null
  message?: string | null
  createdAt: string
}

const props = defineProps<{
  version: Version
}>()

const createdAt = computed(() => {
  return {
    full: formattedFullDate(props.version.createdAt),
    relative: formattedRelativeDate(props.version.createdAt, { capitalize: true })
  }
})
</script>

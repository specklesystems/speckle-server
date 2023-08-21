<template>
  <div class="bg-primary-muted flex gap-2 py-2 px-4">
    <EyeIcon
      v-tippy="'Currently viewing'"
      class="h-4 w-4 text-primary mt-0_5 focus:outline-0 shrink-0"
    />
    <div class="flex flex-col overflow-hidden text-xs select-none">
      <div class="inline-block rounded-full font-bold truncate">
        {{ version.sourceApplication }}
      </div>
      <div class="truncate text-foreground opacity-80">
        {{ version.message || 'no message' }}
      </div>
      <div class="italic text-foreground opacity-60">
        {{ timeAgo }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { EyeIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

interface Version {
  sourceApplication?: string | null
  message?: string | null
  createdAt: string
}

const props = defineProps<{
  version: Version
}>()

const timeAgo = computed(() => {
  return dayjs(props.version.createdAt).from(dayjs())
})
</script>

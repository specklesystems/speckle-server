<template>
  <div class="bg-primary-muted flex gap-2 py-2 px-4">
    <EyeIcon v-tippy="'Currently viewing'" class="h-4 w-4 text-primary mt-0_5" />
    <div class="flex flex-col overflow-hidden text-xs select-none">
      <div class="inline-block rounded-full font-bold">
        {{ version.sourceApplication }}
      </div>
      <div class="truncate text-foreground-2">
        {{ version.message || 'no message' }}
      </div>
      <div class="italic text-foreground-2">
        {{ timeAgo(version.createdAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { EyeIcon } from '@heroicons/vue/24/solid'

dayjs.extend(relativeTime)

defineProps({
  version: Object
})

const timeAgo = (date: string) => {
  if (!date) return 'no message'
  return dayjs(date).from(dayjs())
}
</script>

<template>
  <div
    class="flex flex-col w-full"
    :class="
      background
        ? 'bg-foundation border border-outline-2 rounded-lg overflow-hidden '
        : ''
    "
  >
    <div
      class="flex items-center gap-4 justify-between transition"
      :class="background ? 'pt-4 px-4 sm:px-6 sm:pt-6' : ''"
    >
      <div class="flex items-center gap-2">
        <h3 class="text-heading-lg">{{ title }}</h3>
      </div>
      <div v-if="$slots['top-buttons']" class="flex gap-2">
        <slot name="top-buttons" />
      </div>
    </div>
    <div
      v-if="$slots.introduction"
      class="text-foreground text-body-sm"
      :class="background ? 'px-4 sm:px-6 pt-4' : 'pt-4'"
    >
      <slot name="introduction" />
    </div>
    <div
      class="flex flex-col text-body-sm"
      :class="background ? 'p-4 sm:pb-6 sm:px-6' : ''"
    >
      <slot />
    </div>
    <div
      v-if="disabledMessage || $slots['bottom-buttons']"
      class="flex flex-col sm:flex-row gap-2 justify-between items-end sm:items-center bg-foundation px-4 sm:px-6 py-2 border-t border-outline-2"
    >
      <div v-if="disabledMessage" class="text-xs flex gap-1 sm:items-center w-full">
        <ExclamationCircleIcon
          v-tippy="disabledMessage"
          class="h-5 w-5 text-foreground-2"
        />
        <span class="text-foreground-2">
          You must be a project owner to edit project details
        </span>
      </div>
      <div v-else></div>
      <div v-if="$slots['bottom-buttons']" class="flex gap-2 py-2">
        <slot name="bottom-buttons" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  background?: boolean
  disabledMessage?: string
}>()
</script>

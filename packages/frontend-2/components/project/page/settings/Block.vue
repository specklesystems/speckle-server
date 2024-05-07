<template>
  <div
    class="flex flex-col w-full"
    :class="
      background
        ? 'bg-foundation border border-outline-3 rounded-lg overflow-hidden '
        : ''
    "
  >
    <div
      class="flex items-center gap-4 justify-between transition"
      :class="background ? 'pt-4 px-4 sm:pt-6 sm:px-6' : ''"
    >
      <div class="flex items-center gap-2">
        <component :is="icon" v-if="icon" class="h-5 w-5"></component>
        <h3 class="text-xl font-bold">{{ title }}</h3>
      </div>
      <div v-if="$slots['top-buttons']" class="flex gap-4">
        <slot name="top-buttons" />
      </div>
    </div>
    <div
      v-if="$slots.introduction"
      class="text-foreground"
      :class="background ? 'px-4 sm:px-6 pt-4' : 'pt-6'"
    >
      <slot name="introduction" />
    </div>
    <div class="flex flex-col" :class="background ? 'p-4 sm:p-6' : ''">
      <slot />
    </div>
    <div
      v-if="disabledMessage || $slots['bottom-buttons']"
      class="flex flex-col sm:flex-row gap-2 justify-between items-end sm:items-center bg-gray-50 dark:bg-foundation px-4 sm:px-6 py-4 border-t border-outline-3"
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
      <div v-if="$slots['bottom-buttons']" class="flex gap-2">
        <slot name="bottom-buttons" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropAnyComponent } from '@speckle/ui-components'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  icon?: PropAnyComponent
  background?: boolean
  disabledMessage?: string
}>()
</script>

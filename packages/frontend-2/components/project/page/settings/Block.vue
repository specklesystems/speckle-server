<template>
  <div
    class="flex flex-col w-full"
    :class="
      background
        ? 'bg-foundation border border-primary-muted rounded-lg overflow-hidden '
        : ''
    "
  >
    <div
      class="flex items-center gap-4 border-b border-outline-3 justify-between transition py-4"
      :class="background ? 'px-6' : ''"
    >
      <div class="flex items-center gap-2">
        <component :is="icon" v-if="icon" class="h-5 w-5"></component>
        <h3 class="text-xl font-bold">{{ title }}</h3>
      </div>
      <div v-if="$slots.topButtons" class="hidden sm:flex gap-2">
        <slot name="topButtons" />
      </div>
    </div>
    <div v-if="$slots.topButtons" class="flex sm:hidden gap-2">
      <slot name="topButtons" />
    </div>
    <div
      v-if="$slots.introduction"
      class="text-sm text-foreground mt-4"
      :class="background ? 'px-6' : ''"
    >
      <slot name="introduction" />
    </div>
    <div class="flex flex-col pt-4" :class="background ? 'p-6' : ''">
      <slot />
    </div>
    <div
      v-if="disabledMessage || $slots.bottomButtons"
      class="flex flex-col sm:flex-row gap-2 justify-between items-end sm:items-center bg-gray-50 dark:bg-foundation px-6 py-3 border-t border-primary-muted dark:border-outline-3"
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
      <div v-if="$slots.bottomButtons" class="flex gap-2">
        <slot name="bottomButtons" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropAnyComponent } from '@speckle/ui-components'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title: string
  icon: PropAnyComponent
  background?: boolean
  disabledMessage?: string
}>()
</script>

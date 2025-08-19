<template>
  <div :class="['flex flex-col h-full', disableScrollbar ? '' : 'overflow-hidden']">
    <div
      class="flex shrink-0 justify-between items-center border-b border-outline-3 h-10 pl-4 pr-2"
    >
      <slot name="fullTitle">
        <div class="text-body-xs text-foreground font-medium leading-none">
          <span v-if="title" class="truncate">{{ title }}</span>
          <slot name="title"></slot>
        </div>
        <slot name="actions"></slot>
      </slot>
    </div>
    <div
      :class="[
        'flex flex-col flex-1 min-h-0 grow',
        disableScrollbar ? '' : 'overflow-y-auto overflow-x-hidden simple-scrollbar'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  disableScrollbar?: boolean
}>()
</script>

import { LayoutSidebarPromo } from '~~/src/lib';
<template>
  <aside class="flex flex-col justify-between h-full w-full">
    <div
      class="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden simple-scrollbar"
    >
      <slot></slot>
    </div>
    <div v-if="$slots.promo" class="shrink-0">
      <slot name="promo"></slot>
    </div>
  </aside>
</template>

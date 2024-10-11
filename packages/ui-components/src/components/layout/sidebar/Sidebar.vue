<template>
  <!-- If promo content is defined, scroll the menu items. If not, scroll the whole aside  -->
  <aside
    class="flex flex-col justify-between h-full w-full"
    :class="$slots.promo ? '' : 'overflow-y-auto overflow-x-hidden simple-scrollbar'"
  >
    <div
      class="flex flex-col h-full w-full"
      :class="$slots.promo ? 'overflow-y-auto overflow-x-hidden simple-scrollbar' : ''"
    >
      <slot></slot>
    </div>
    <div v-if="$slots.promo" class="shrink-0 pt-2">
      <slot name="promo"></slot>
    </div>
  </aside>
</template>

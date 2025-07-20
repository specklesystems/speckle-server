<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle
      v-tippy="tooltip"
      flat
      secondary
      :active="open"
      @click="toggleMenu"
    >
      <slot name="trigger-icon" />
    </ViewerControlsButtonToggle>
    <div
      v-if="open"
      ref="menuContent"
      v-keyboard-clickable
      :class="[
        'absolute bg-foundation rounded-md border border-outline-2 flex flex-col overflow-hidden shadow',
        align === 'top'
          ? 'bottom-10 sm:bottom-[46px] left-1/2 -translate-x-1/2'
          : 'right-10 sm:right-[46px] -top-0'
      ]"
    >
      <div
        v-if="$slots.title"
        class="flex items-center py-2 px-2 border-b border-outline-2 sticky top-0 z-50 bg-foundation"
      >
        <div class="flex items-center text-body-2xs text-foreground font-medium">
          <span class="truncate flex-1">
            <slot name="title"></slot>
          </span>
        </div>
      </div>
      <div class="max-h-68 simple-scrollbar overflow-y-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

withDefaults(
  defineProps<{
    tooltip?: string
    align?: 'right' | 'top'
  }>(),
  {
    align: 'right'
  }
)

const open = defineModel<boolean>('open', { default: false })

const menuContent = ref<HTMLElement | null>(null)
const menuWrapper = ref<HTMLElement | null>(null)

const toggleMenu = () => {
  open.value = !open.value
}

onClickOutside(
  menuContent,
  (event) => {
    if (!menuWrapper.value?.contains(event.target as Node)) {
      open.value = false
    }
  },
  { ignore: [menuWrapper] }
)
</script>

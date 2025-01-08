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
      class="absolute left-10 sm:left-12 -top-0 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

defineProps<{
  tooltip?: string
}>()

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

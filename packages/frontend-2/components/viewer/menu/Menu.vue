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
      v-keyboard-clickable
      class="absolute translate-x-0 w-56 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

defineProps<{
  tooltip?: string
}>()

const menuWrapper = ref(null)

const toggleMenu = () => {
  open.value = !open.value
}
</script>

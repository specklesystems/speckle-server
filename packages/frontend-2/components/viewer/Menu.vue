<template>
  <div ref="menuWrapper" class="relative z-30">
    <ViewerControlsButtonToggle
      v-tippy="tooltip"
      flat
      secondary
      :active="open"
      @click="open = !open"
    >
      <slot name="trigger-icon" />
    </ViewerControlsButtonToggle>
    <Transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        v-keyboard-clickable
        class="absolute translate-x-0 w-56 left-10 sm:left-12 -top-0 sm:-top-2 bg-foundation max-h-64 simple-scrollbar overflow-y-auto rounded-lg shadow-md flex flex-col p-1.5"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'

defineProps<{
  tooltip?: string
}>()

const open = defineModel<boolean>('open', { required: true })

const menuWrapper = ref(null)

onClickOutside(menuWrapper, () => {
  open.value = false
})
</script>

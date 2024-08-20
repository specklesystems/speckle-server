<template>
  <div
    v-if="!hasChildren"
    v-tippy="tooltipText"
    :to="to"
    class="group flex items-center space-x-2 shrink-0 text-body-xs text-foreground select-none rounded-md w-full py-1 px-5"
    :class="[
      !disabled && 'cursor-pointer hover:bg-highlight-1',
      active && 'bg-highlight-3 hover:!bg-highlight-3'
    ]"
  >
    <div class="flex items-center space-x-2" :class="[disabled && 'opacity-60']">
      <div v-if="$slots.icon" class="h-5 w-5 flex items-center justify-center">
        <slot name="icon" />
      </div>
      <span :class="$slots.icon ? '' : 'pl-2'">
        {{ label }}
      </span>
    </div>
    <div
      v-if="tag"
      class="text-body-3xs bg-primary-muted py-0.5 px-2 rounded-full text-foreground-2"
    >
      {{ tag }}
    </div>
  </div>
  <div v-else class="flex flex-col">
    <button
      v-tippy="tooltipText"
      class="group flex space-x-1.5 items-center w-full rounded-md p-0.5"
      :class="[
        !disabled && 'cursor-pointer text-foreground-2 hover:text-foreground',
        disabled && 'opacity-60'
      ]"
      @click="toggleOpen"
    >
      <Arrow :class="[isOpen ? '' : '-rotate-90']" />

      <h6 class="text-heading-sm flex items-center space-x-1.5">
        {{ label }}
      </h6>
    </button>
    <div v-show="isOpen" class="pl-4">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useSlots } from 'vue'
import Arrow from '~~/src/components/layout/sidebar/menu/group/Arrow.vue'

const props = defineProps<{
  label: string
  to?: string
  tag?: string
  external?: boolean
  disabled?: boolean
  active?: boolean
  tooltipText?: string
}>()

const isOpen = ref(true)

const slots = useSlots()

const hasChildren = !!slots.default

const toggleOpen = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}
</script>

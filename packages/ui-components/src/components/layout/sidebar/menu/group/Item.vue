<template>
  <div
    v-if="!hasChildren"
    v-tippy="tooltipText"
    :to="to"
    class="group flex items-center space-x-2 shrink-0 text-body-xs text-foreground select-none rounded-md w-full py-1 px-5"
    :class="[
      !disabled && 'cursor-pointer hover:bg-primary-muted',
      active && 'bg-highlight-2 hover:!bg-highlight-2'
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
        !disabled && 'cursor-pointer hover:bg-foundation-3',
        disabled && 'opacity-60'
      ]"
      @click="toggleOpen"
    >
      <svg
        width="8"
        height="4"
        viewBox="0 0 8 4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        :class="[isOpen ? '' : '-rotate-90']"
      >
        <path
          d="M3.64645 3.74984C3.84171 3.9451 4.15829 3.9451 4.35355 3.74984L7.14645 0.956947C7.46143 0.641965 7.23835 0.103394 6.79289 0.103394L1.20711 0.103394C0.761654 0.103394 0.53857 0.641964 0.853552 0.956946L3.64645 3.74984Z"
          fill="#626263"
        />
      </svg>

      <h6 class="text-heading-sm text-foreground flex items-center space-x-1.5">
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

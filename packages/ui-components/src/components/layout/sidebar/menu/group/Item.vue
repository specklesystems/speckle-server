<template>
  <div
    v-if="!hasChildren"
    v-tippy="tooltipText"
    :to="to"
    class="group flex items-center space-x-2 shrink-0 text-body-xs text-foreground select-none rounded-md w-full py-1 px-5"
    :class="[!disabled && 'cursor-pointer hover:bg-primary-muted']"
    exact-active-class="bg-foundation-focus hover:!bg-foundation-focus"
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
      <ChevronDownIcon :class="[isOpen && 'rotate-180']" class="h-2.5 w-2.5" />
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
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { ref, useSlots } from 'vue'

const props = defineProps<{
  label: string
  to?: string
  tag?: string
  external?: boolean
  disabled?: boolean
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

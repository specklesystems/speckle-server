<template>
  <div
    v-if="!hasChildren"
    v-tippy="tooltipText"
    :to="to"
    class="group/item flex items-center justify-between space-x-2 shrink-0 text-body-xs text-foreground select-none rounded-md w-full py-1 px-2"
    :class="[
      !disabled && 'cursor-pointer hover:bg-highlight-1',
      active && 'bg-highlight-3 hover:!bg-highlight-3'
    ]"
  >
    <div
      class="flex items-center space-x-3 truncate"
      :class="[disabled && 'opacity-60']"
    >
      <div v-if="$slots.icon" class="h-5 w-5 flex items-center justify-center">
        <slot name="icon" />
      </div>
      <span class="truncate" :class="$slots.icon ? '' : 'pl-2'">
        {{ label }}
      </span>
      <ArrowUpRightIcon
        v-if="external"
        class="h-2.5 w-2.5 !stroke-[3px] -ml-1 -mt-1.5 opacity-0 group-hover/item:opacity-100"
      />
    </div>
    <CommonBadge
      v-if="tag"
      rounded
      :color-classes="disabled ? 'text-foreground-2 bg-primary-muted' : undefined"
    >
      {{ tag }}
    </CommonBadge>
  </div>
  <div v-else class="flex flex-col">
    <button
      v-tippy="tooltipText"
      class="flex space-x-1.5 items-center w-full rounded-md p-0.5"
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
import { ArrowUpRightIcon } from '@heroicons/vue/24/outline'
import CommonBadge from '~~/src/components/common/Badge.vue'

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

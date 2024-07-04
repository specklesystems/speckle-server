<template>
  <div>
    <NuxtLink
      v-if="!hasChildren"
      :to="to"
      class="group flex items-center justify-between gap-2 shrink-0 text-sm select-none rounded-md w-full hover:bg-primary-muted p-1.5 cursor-pointer"
      active-class="bg-foundation-focus hover:!bg-foundation-focus"
      :external="external"
      :target="external ? '_blank' : undefined"
    >
      <div class="flex items-center gap-2">
        <div v-if="$slots.icon" class="h-5 w-5 flex items-center justify-center">
          <slot name="icon" />
        </div>
        <span :class="$slots.icon ? '' : 'pl-2'">
          {{ label }}
        </span>
      </div>
      <div
        v-if="tag"
        class="text-xs uppercase bg-primary-muted py-0.5 px-2 rounded-full font-medium text-primary-focus group-hover:bg-white"
      >
        {{ tag }}
      </div>
    </NuxtLink>
    <div v-else class="flex flex-col">
      <button
        class="group flex gap-1.5 items-center w-full hover:bg-foundation-3 rounded-md p-0.5 cursor-pointer"
        @click="isOpen = !isOpen"
      >
        <ChevronDownIcon :class="isOpen ? '' : 'rotate-180'" class="h-2.5 w-2.5" />
        <h6 class="font-bold text-foreground-2 text-xs flex items-center gap-1.5">
          {{ label }}
        </h6>
      </button>
      <div v-show="isOpen" class="pl-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { ref, resolveDynamicComponent, useSlots } from 'vue'

defineProps<{
  label: string
  to: string
  tag?: string
  external?: boolean
}>()

const isOpen = ref(true)

const NuxtLink = resolveDynamicComponent('NuxtLink')

const slots = useSlots()

const hasChildren = !!slots.default
</script>

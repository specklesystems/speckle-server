<template>
  <div class="flex flex-col">
    <div v-if="title" class="select-none mb-1">
      <button
        v-if="collapsible"
        class="group flex gap-1.5 items-center w-full hover:bg-foundation-3 rounded-md p-0.5"
        @click="isOpen = !isOpen"
      >
        <ChevronDownIcon :class="isOpen ? '' : 'rotate-180'" class="size-2.5" />
        <h6 class="font-bold text-foreground-2 text-xs flex items-center gap-1.5">
          {{ title }}
        </h6>
      </button>
      <div v-else class="flex gap-1.5 items-center w-full p-0.5 text-foreground-2">
        <div
          v-if="$slots['title-icon']"
          class="size-5 flex items-center justify-center"
        >
          <slot name="title-icon"></slot>
        </div>
        <h6 class="font-bold text-xs">
          {{ title }}
        </h6>
      </div>
    </div>

    <div v-show="isOpen">
      <div v-for="(item, itemIndex) in items" :key="itemIndex">
        <NuxtLink
          :to="item.to"
          class="group flex items-center justify-between gap-2 shrink-0 text-sm select-none rounded-md w-full hover:bg-primary-muted p-1.5"
          active-class="bg-foundation-focus hover:!bg-foundation-focus"
          :external="item.external"
          :target="item.external ? '_blank' : undefined"
        >
          <div class="flex items-center gap-2">
            <div v-if="$slots[item.id]" class="size-5 flex items-center justify-center">
              <slot :name="item.id" />
            </div>
            <span :class="$slots[item.id] ? '' : 'pl-2'">
              {{ item.label }}
            </span>
          </div>
          <div
            v-if="item.tag"
            class="text-xs uppercase bg-primary-muted py-0.5 px-2 rounded-full font-medium text-primary-focus group-hover:bg-white"
          >
            {{ item.tag }}
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { ref, resolveDynamicComponent } from 'vue'

interface MenuItem {
  label: string
  id: string
  to: string
  tag?: string
  external?: boolean
}

defineProps<{
  title?: string
  items: MenuItem[]
  collapsible?: boolean
}>()

const isOpen = ref(true)

const NuxtLink = resolveDynamicComponent('NuxtLink')
</script>

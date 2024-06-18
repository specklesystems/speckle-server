<template>
  <div class="flex gap-8 flex-col lg:flex-row">
    <div class="lg:w-2/12">
      <div class="flex w-full flex-col gap-1">
        <button
          v-for="item in items"
          :key="item.id"
          :data-tab-id="item.id"
          :class="[buttonClass(item)]"
          :disabled="item.disabled"
          @click="setActiveItem(item)"
        >
          <div
            v-tippy="
              item.disabled && item.disabledMessage ? item.disabledMessage : undefined
            "
            class="absolute inset-0"
          ></div>
          <div class="flex gap-2 items-center px-2">
            <component
              :is="item.icon"
              v-if="item.icon"
              class="shrink-0 h-4 w-4 stroke-[2px]"
            ></component>
            <span class="min-w-6">{{ item.title }}</span>
            <div
              v-if="item.count"
              class="rounded-full px-2 text-[11px] transition-all min-w-6"
              :class="
                activeItem?.id === item.id
                  ? 'text-primary bg-blue-100'
                  : 'text-foreground-2 bg-gray-200 dark:bg-foundation'
              "
            >
              <span>{{ item.count }}</span>
            </div>
            <div
              v-if="item.tag"
              class="text-[10px] leading-tight py-0.5 text-foreground-on-primary font-medium px-1.5 rounded-full bg-gradient-to-tr from-[#7025EB] to-primary select-none mt-0.5"
            >
              {{ item.tag }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <div class="lg:w-10/12">
      <slot :active-item="activeItem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import { isClient } from '@vueuse/core'

const props = defineProps<{
  items: LayoutPageTabItem[]
}>()

const activeItem = defineModel<LayoutPageTabItem>('activeItem', { required: true })

const buttonClass = computed(() => {
  return (item: LayoutPageTabItem) => {
    const isActive = activeItem.value?.id === item.id
    const baseClasses = [
      'relative',
      'flex items-center gap-1.5',
      'disabled:opacity-60 disabled:hover:border-transparent disabled:cursor-not-allowed disabled:hover:bg-transparent',
      'text-base',
      'border-l-2',
      'py-1'
    ]

    if (isActive)
      baseClasses.push(
        'text-primary hover:text-primary bg-primary-muted border-primary'
      )
    else baseClasses.push('border-transparent text-foreground')

    return baseClasses
  }
})

const setActiveItem = (item: LayoutPageTabItem) => {
  activeItem.value = item
}

onMounted(() => {
  if (isClient) {
    if (props.items.length && !activeItem.value) {
      setActiveItem(props.items[0])
    }
  }
})

watch(
  () => [props.items, activeItem.value],
  ([newItems]) => {
    if (Array.isArray(newItems) && newItems.length && !activeItem.value) {
      setActiveItem(newItems[0])
    }
  }
)
</script>

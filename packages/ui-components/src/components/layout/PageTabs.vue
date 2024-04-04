<template>
  <div
    class="relative z-10 flex gap-4"
    :class="vertical ? 'md:gap-8 flex-col md:flex-row' : 'md:gap-10 flex-col'"
  >
    <div
      class="relative flex md:justify-between overflow-x-auto"
      :class="
        vertical
          ? 'items-center md:items-start md:flex-col md:w-2/12 xl:w-3/12 shrink-0 gap-6'
          : 'border-b border-outline-3 lg:border-none gap-8 w-full'
      "
    >
      <template v-if="!vertical">
        <div
          class="hidden lg:block absolute bottom-0 left-0 h-px w-full bg-outline-3"
        ></div>
        <div
          :style="borderStyle"
          class="h-[2px] absolute bottom-0 z-20 bg-primary transition-all duration-300"
        ></div>
      </template>

      <div
        ref="buttonContainer"
        class="flex"
        :class="vertical ? 'flex-col gap-1 w-full' : 'gap-6'"
      >
        <h1
          v-if="title"
          class="font-bold h4"
          :class="vertical ? 'w-full md:w-auto mb-4' : 'mb-2'"
        >
          {{ title }}
        </h1>
        <button
          v-for="item in items"
          :key="item.id"
          :data-tab-id="item.id"
          :class="buttonClass(item)"
          class="tab-button"
          @click="setActiveItem(item)"
        >
          <component :is="item.icon" v-if="item.icon" class="h-5 w-5"></component>
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
        </button>
      </div>
    </div>
    <div :class="vertical ? 'md:w-9/12 xl:w-10/12' : ''">
      <slot :active-item="activeItem" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, type CSSProperties, onMounted, watch } from 'vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import type { Nullable } from '@speckle/shared'
import { isClient } from '@vueuse/core'

const props = defineProps<{
  items: LayoutPageTabItem[]
  vertical?: boolean
  title?: string
}>()

const activeItem = defineModel<LayoutPageTabItem>('activeItem', { required: true })
const buttonContainer = ref(null as Nullable<HTMLDivElement>)

const buttonClass = computed(() => {
  return (item: LayoutPageTabItem) => {
    const isActive = activeItem.value?.id === item.id
    const baseClasses = ['relative', 'z-10', 'flex', 'items-center']

    if (props.vertical) {
      baseClasses.push('text-sm', 'gap-2', 'border-l-[4px] pl-1.5 py-1.5')
      if (isActive)
        baseClasses.push(
          'font-bold bg-primary-muted border-primary hover:border-outline'
        )
      else baseClasses.push('text-foreground border-transparent')
    } else {
      baseClasses.push(
        'text-sm sm:text-base',
        'gap-1.5',
        'hover:border-outline-2',
        'pb-2',
        'border-b-[2px]',
        'border-transparent',
        'max-w-max'
      )
      if (isActive) baseClasses.push('text-primary', 'hover:text-primary')
      else baseClasses.push('text-foreground')
    }

    return baseClasses
  }
})

const activeItemRef = computed(() => {
  const id = activeItem.value?.id
  if (!id) return null

  const parent = buttonContainer.value
  if (!parent) return null

  const btns = [...parent.getElementsByClassName('tab-button')] as HTMLButtonElement[]
  return btns.find((b) => b.dataset['tabId'] === id) || null
})

const borderStyle = computed(() => {
  const element = activeItemRef.value
  const style: CSSProperties = {
    left: `${element?.offsetLeft || 0}px`,
    width: `${element?.clientWidth || 0}px`
  }
  return style
})

const setActiveItem = (item: LayoutPageTabItem) => {
  activeItem.value = item
}

if (isClient) {
  // Doing onMounted & watch separately to avoid hydration mismatch
  onMounted(() => {
    if (props.items.length && !activeItem.value) {
      setActiveItem(props.items[0])
    }
  })

  watch(
    () => [props.items, activeItem.value] as const,
    ([newItems, activeItem]) => {
      if (newItems.length && !activeItem) {
        setActiveItem(newItems[0])
      }
    }
  )
}
</script>

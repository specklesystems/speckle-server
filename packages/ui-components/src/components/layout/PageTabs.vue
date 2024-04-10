<template>
  <div
    class="relative z-10 flex gap-4"
    :class="
      vertical ? 'lg:gap-8 flex-col lg:flex-row' : 'md:gap-10 flex-col overflow-hidden'
    "
  >
    <!-- Left Arrow Button -->
    <button
      v-if="showLeftArrow"
      class="absolute h-6 sm:h-16 bg-gradient-to-r pr-5 pl-1 from-foundation-page to-transparent left-0 -top-1 z-20"
      @click="scrollLeft"
    >
      <ArrowLongLeftIcon class="h-4 w-4" />
    </button>
    <div
      ref="scrollContainer"
      class="relative flex overflow-x-auto"
      :class="
        vertical
          ? 'items-center md:items-start lg:flex-col lg:w-2/12 shrink-0 gap-4 sm:gap-6'
          : 'gap-8 w-full'
      "
      @scroll="handleScroll"
    >
      <template v-if="!vertical">
        <div class="hidden sm:block absolute bottom-0 h-px w-full bg-outline-3"></div>
        <div
          :style="borderStyle"
          class="h-[2px] absolute bottom-0 z-20 transition-[left,width] duration-300"
          :class="isInitialSetup ? 'bg-transparent' : 'bg-primary'"
        ></div>
      </template>

      <div
        ref="buttonContainer"
        class="flex w-full"
        :class="
          vertical
            ? 'flex-col gap-1'
            : 'gap-6 border-b-[2px] border-outline sm:border-b-0'
        "
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
          :class="[
            buttonClass(item),
            { '!border-primary': !vertical && isActiveItem(item) && isInitialSetup }
          ]"
          class="tab-button"
          :disabled="item.disabled"
          @click="setActiveItem(item)"
        >
          <div class="flex gap-1 sm:gap-1.5 items-center">
            <component
              :is="item.icon"
              v-if="item.icon"
              class="h-4 w-4 sm:h-5 sm:w-5"
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
          <InformationCircleIcon
            v-if="item.disabled && item.disabledMessage"
            v-tippy="item.disabledMessage"
            class="w-4 h-4 ml-auto opacity-60 hover:opacity-100"
          />
        </button>
      </div>
    </div>

    <!-- Right Arrow Button -->
    <button
      v-if="showRightArrow"
      class="absolute -right-px -top-1 z-20 pl-5 pr-1 h-6 sm:h-16 bg-gradient-to-l from-foundation-page to-transparent"
      @click="scrollRight"
    >
      <ArrowLongRightIcon class="h-4 w-4" />
    </button>

    <div :class="vertical ? 'lg:w-10/12' : ''">
      <slot :active-item="activeItem" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { LayoutPageTabItem } from '~~/src/helpers/layout/components'
import { isClient } from '@vueuse/core'
import {
  InformationCircleIcon,
  ArrowLongRightIcon,
  ArrowLongLeftIcon
} from '@heroicons/vue/24/outline'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  items: LayoutPageTabItem[]
  vertical?: boolean
  title?: string
}>()

const activeItem = defineModel<LayoutPageTabItem>('activeItem', { required: true })
const buttonContainer = ref(null as Nullable<HTMLDivElement>)
const scrollContainer = ref<HTMLElement | null>(null)
const showLeftArrow = ref(false)
const showRightArrow = ref(false)
const isInitialSetup = ref(true)

const buttonClass = computed(() => {
  return (item: LayoutPageTabItem) => {
    const isActive = activeItem.value?.id === item.id
    const baseClasses = [
      'relative',
      'z-10',
      'flex',
      'items-center',
      'disabled:opacity-60 disabled:hover:border-outline'
    ]

    if (props.vertical) {
      baseClasses.push(
        'text-sm gap-2 border-l-[4px] pl-1.5 py-1.5 hover:bg-primary-muted'
      )
      if (isActive)
        baseClasses.push(
          'font-bold bg-primary-muted border-primary hover:border-outline'
        )
      else baseClasses.push('text-foreground border-transparent')
    } else {
      baseClasses.push(
        'text-sm sm:text-base',
        'gap-1.5',
        'hover:sm:border-outline-2',
        'pb-2',
        'border-b-[2px]',
        'border-transparent',
        'max-w-max',
        'last:mr-6'
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

  const btns = [...parent.getElementsByClassName('tab-button')] as HTMLElement[]
  return btns.find((b) => b.dataset['tabId'] === id) || null
})

const borderStyle = computed<CSSProperties>(() => {
  const element = activeItemRef.value
  return {
    left: `${element?.offsetLeft || 0}px`,
    width: `${element?.clientWidth || 0}px`
  }
})

const setActiveItem = (item: LayoutPageTabItem) => {
  activeItem.value = item
  isInitialSetup.value = false
}

const isActiveItem = (item: LayoutPageTabItem) => {
  return activeItem.value?.id === item.id
}

const checkArrowsVisibility = () => {
  const container = scrollContainer.value
  if (!container) return

  const scrollWidth = container.scrollWidth
  const clientWidth = container.clientWidth
  const scrollLeft = container.scrollLeft
  const buffer = 1

  showLeftArrow.value = scrollLeft > buffer
  showRightArrow.value = scrollLeft < scrollWidth - clientWidth - buffer
}

const scrollLeft = () => {
  scrollContainer.value?.scrollBy({ left: -100, behavior: 'smooth' }) // Adjust the scroll amount as needed
  checkArrowsVisibility()
}

const scrollRight = () => {
  scrollContainer.value?.scrollBy({ left: 100, behavior: 'smooth' }) // Adjust the scroll amount as needed
  checkArrowsVisibility()
}

const handleScroll = () => {
  checkArrowsVisibility()
}

onMounted(() => {
  if (isClient) {
    if (props.items.length && !activeItem.value) {
      setActiveItem(props.items[0])
    }
    checkArrowsVisibility()
  }
})

watch(
  () => [props.items, activeItem.value] as const,
  ([newItems]) => {
    if (Array.isArray(newItems) && newItems.length && !activeItem.value) {
      setActiveItem(newItems[0] as LayoutPageTabItem)
    }
    checkArrowsVisibility()
  }
)
</script>

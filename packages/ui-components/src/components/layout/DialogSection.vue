<template>
  <div
    class="flex flex-col border-primary-muted"
    :class="{
      'border-t': borderT,
      'border-b': borderB,
      'relative z-10': isExpanded
    }"
  >
    <div
      class="flex justify-between items-center gap-4 sm:gap-8 py-3 sm:py-4 px-2"
      :class="backgroundClass"
      tabindex="0"
      v-on="
        !button && !alwaysOpen
          ? {
              click: toggleExpansion,
              keypress: keyboardClick(toggleExpansion)
            }
          : {}
      "
    >
      <div
        class="text-sm sm:text-base font-bold flex items-center gap-1 sm:gap-2 select-none"
        :class="titleClasses"
      >
        <div class="h-4 sm:h-5 h-4 sm:w-5 empty:h-0 empty:w-0">
          <slot name="icon"></slot>
        </div>
        <span>{{ title }}</span>
        <span v-if="guidedOpen" class="relative flex h-2 w-2">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
          ></span>
          <span
            class="relative inline-flex rounded-full h-2 w-2 bg-primary opacity-80"
          ></span>
        </span>
      </div>
      <div>
        <ChevronDownIcon
          v-if="!button && !alwaysOpen"
          class="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-400"
          :class="isExpanded && 'rotate-180'"
        />
        <FormButton
          v-if="button"
          size="sm"
          :to="button.expandContent ? undefined : button.to"
          :color="button.expandContent && isExpanded ? 'invert' : button.color"
          :icon-right="
            button.expandContent && isExpanded ? undefined : button.iconRight
          "
          @click="button?.onClick"
          v-on="button?.expandContent ? { click: toggleExpansion } : {}"
        >
          {{ button.expandContent && isExpanded ? 'Cancel' : button.text }}
        </FormButton>
      </div>
    </div>
    <div
      class="transition-all duration-700 overflow-hidden"
      :class="[
        allowOverflow && isExpanded ? '!overflow-visible' : '',
        isExpanded ? 'mb-3 mt-1' : '',
        !button && !alwaysOpen ? 'cursor-pointer hover:bg-foundation' : ''
      ]"
      :style="
        alwaysOpen
          ? 'max-height: none;'
          : `max-height: ${isExpanded ? contentHeight + 'px' : '0px'}`
      "
    >
      <div ref="content" class="rounded-md text-sm pb-3 px-2 mt-1">
        <slot>Panel contents</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, unref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { FormButton } from '~~/src/lib'
import { keyboardClick } from '~~/src/helpers/global/accessibility'
import type { PropAnyComponent } from '~~/src/helpers/common/components'

type TitleColor = 'default' | 'danger' | 'warning' | 'success' | 'secondary' | 'info'

type FormButtonColor =
  | 'default'
  | 'invert'
  | 'danger'
  | 'warning'
  | 'success'
  | 'card'
  | 'secondary'
  | 'info'

const props = defineProps({
  title: String,
  borderT: Boolean,
  borderB: Boolean,
  allowOverflow: Boolean,
  titleColor: {
    type: String as () => TitleColor,
    default: 'default'
  },
  button: Object as () =>
    | {
        expandContent?: boolean
        text: string
        to?: string
        color: FormButtonColor
        iconRight?: PropAnyComponent | undefined
        onClick?: () => void
      }
    | undefined,
  alwaysOpen: Boolean,
  guidedOpen: Boolean
})

const content: Ref<HTMLElement | null> = ref(null)
const contentHeight = ref(0)
const isExpanded = ref(false)

const backgroundClass = computed(() => {
  const classes = []

  if (!props.button && !props.alwaysOpen) {
    classes.push('cursor-pointer', 'hover:bg-foundation')
  }

  if (isExpanded.value) {
    classes.push('bg-foundation')
  }

  return classes
})

const titleClasses = computed(() => {
  switch (props.titleColor) {
    case 'danger':
      return 'text-danger'
    case 'warning':
      return 'text-warning'
    case 'success':
      return 'text-success'
    case 'secondary':
      return 'text-secondary'
    case 'info':
      return 'text-info'
    default:
      return 'text-foreground'
  }
})

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
}

onMounted(() => {
  isExpanded.value = props.guidedOpen || false
  if (isExpanded.value) {
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
})
</script>

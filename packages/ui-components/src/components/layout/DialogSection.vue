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
      class="flex justify-between items-center space-x-4 sm:space-x-8 py-2.5 px-2"
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
        class="text-heading-sm flex items-center space-x-1 sm:space-x-2 select-none"
        :class="titleClasses"
      >
        <div v-if="$slots.icon || icon" class="h-4 w-4 empty:h-0 empty:w-0">
          <slot v-if="$slots.icon" name="icon" />
          <Component :is="icon" v-if="icon" class="w-full h-full" />
        </div>
        <span>{{ title }}</span>
      </div>
      <div>
        <ChevronDownIcon
          v-if="!button && !alwaysOpen"
          class="w-4 h-4 transition-all duration-400"
          :class="isExpanded && 'rotate-180'"
        />
        <FormButton
          v-if="button"
          :to="button.expandContent ? undefined : button.to"
          :color="button.expandContent && isExpanded ? 'outline' : button.color"
          :icon-right="
            button.expandContent && isExpanded ? undefined : button.iconRight
          "
          size="sm"
          @click="button?.onClick"
          v-on="button?.expandContent ? { click: toggleExpansion } : {}"
        >
          {{ button.expandContent && isExpanded ? 'Cancel' : button.text }}
        </FormButton>
      </div>
    </div>
    <div
      class="transition-all duration-300 overflow-hidden"
      :class="[
        allowOverflow && isExpanded ? '!overflow-visible' : '',
        isExpanded ? 'mb-2 mt-1' : '',
        !button && !alwaysOpen ? 'cursor-pointer hover:bg-foundation-page' : ''
      ]"
      :style="
        alwaysOpen
          ? 'max-height: none;'
          : `max-height: ${isExpanded ? contentHeight + 'px' : '0px'}`
      "
    >
      <template v-if="props.lazyLoad">
        <div
          v-if="isExpanded || props.alwaysOpen"
          ref="content"
          class="rounded-md text-sm pb-3 px-2 mt-1"
        >
          <slot>Panel contents</slot>
        </div>
      </template>

      <template v-else>
        <div ref="content" class="rounded-md text-sm pb-3 px-2 mt-1">
          <slot>Panel contents</slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, unref, computed, nextTick } from 'vue'
import type { PropType, Ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { FormButton } from '~~/src/lib'
import { keyboardClick } from '~~/src/helpers/global/accessibility'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import type { FormButtonStyle } from '~~/src/helpers/form/button'

type TitleColor = 'default' | 'danger' | 'warning' | 'success' | 'secondary' | 'info'

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
        color: FormButtonStyle
        iconRight?: PropAnyComponent | undefined
        onClick?: () => void
      }
    | undefined,
  alwaysOpen: Boolean,
  lazyLoad: {
    type: Boolean,
    default: false
  },
  icon: {
    type: [Function, Object] as PropType<PropAnyComponent>,
    default: undefined
  }
})

const content: Ref<HTMLElement | null> = ref(null)
const contentHeight = ref(0)
const isExpanded = ref(false)

const backgroundClass = computed(() => {
  const classes = []

  if (!props.button && !props.alwaysOpen) {
    classes.push('cursor-pointer', 'hover:bg-foundation-page-2')
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

const toggleExpansion = async () => {
  isExpanded.value = !isExpanded.value

  if (isExpanded.value) {
    await nextTick()
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
}
</script>

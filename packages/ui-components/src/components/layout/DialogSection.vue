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
      class="flex justify-between items-center gap-4 sm:gap-8 py-4 px-2"
      :class="backgroundClass"
      tabindex="0"
      v-on="
        !button && !alwaysOpen
          ? {
              click: toggleExpansion,
              keypress: toggleExpansion
            }
          : {}
      "
    >
      <div
        class="text-sm sm:text-base font-bold flex items-center gap-1 sm:gap-2 select-none"
      >
        <Component :is="icon" v-if="icon" class="h-4 sm:h-5 h-4 sm:w-5" />
        <span>{{ title }}</span>
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
import { ConcreteComponent, ref, unref, Ref, computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { FormButton } from '~~/src/lib'
import { FormButtonColor } from '../form/Button.vue'

interface DialogSectionProps {
  title?: string
  icon?: ConcreteComponent
  borderT?: boolean
  borderB?: boolean
  allowOverflow?: boolean
  button?: {
    expandContent?: boolean
    text: string
    to?: string
    color: FormButtonColor
    iconRight?: ConcreteComponent
  }
  alwaysOpen?: boolean
}

const props = defineProps<DialogSectionProps>()

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

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
}
</script>

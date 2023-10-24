<template>
  <div
    class="flex flex-col border-primary-muted"
    :class="{
      'border-t': borderT,
      'border-b': borderB
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
      <div class="font-bold flex items-center gap-2 select-none">
        <Component :is="icon" v-if="icon" class="h-5 w-5" />
        <span>{{ title }}</span>
      </div>
      <div>
        <ChevronDownIcon
          v-if="!button && !alwaysOpen"
          class="w-5 h-5 transition-all duration-400"
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

const props = defineProps({
  title: String,
  icon: Object as () => ConcreteComponent | undefined,
  borderT: Boolean,
  borderB: Boolean,
  allowOverflow: Boolean,
  button: Object as () =>
    | {
        expandContent?: boolean
        text: string
        to?: string
        color: FormButtonColor
        iconRight?: ConcreteComponent
      }
    | undefined,
  alwaysOpen: Boolean
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

const toggleExpansion = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    contentHeight.value = (unref(content)?.scrollHeight || 0) + 64
  }
}
</script>

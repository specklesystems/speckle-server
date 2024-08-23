<template>
  <div class="relative group">
    <div
      v-if="fancyGlow"
      class="absolute -top-1 -left-1 -right-1 -bottom-1 bg-blue-300 dark:bg-blue-500 opacity-5 dark:opacity-0 rounded-md blur-sm group-hover:opacity-60 dark:group-hover:opacity-30 transition duration-500"
    ></div>
    <Component
      :is="form ? 'form' : 'div'"
      :class="[
        'relative divide-outline-3 bg-foundation text-foreground flex flex-col divide-y overflow-hidden',
        computedClasses
      ]"
      @submit="emit('submit', $event)"
    >
      <div v-if="$slots.header" :class="secondarySlotPaddingClasses">
        <slot name="header" />
      </div>
      <div :class="['grow', defaultSlotPaddingClasses]">
        <slot />
      </div>
      <div v-if="$slots.footer" :class="secondarySlotPaddingClasses">
        <slot name="footer" />
      </div>
    </Component>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{ (e: 'submit', val: SubmitEvent): void }>()

const props = defineProps({
  /**
   * Use a `<form/>` element as a wrapper that will emit 'submit' events out from the component when they occur
   */
  form: {
    type: Boolean,
    default: false
  },
  /**
   * Add a ring outline on hover
   */
  ring: {
    type: Boolean,
    default: false
  },
  /**
   * Add a primary-colored glow on hover
   */
  fancyGlow: {
    type: Boolean,
    default: false
  },
  customPadding: {
    type: Boolean,
    default: false
  },
  noShadow: {
    type: Boolean,
    default: false
  },
  panelClasses: {
    type: String
  }
})

const secondarySlotPaddingClasses = computed(() =>
  props.customPadding ? '' : 'px-4 py-4 sm:px-6'
)
const defaultSlotPaddingClasses = computed(() =>
  props.customPadding ? '' : 'px-4 py-4 sm:p-6'
)

const computedClasses = computed(() => {
  const classParts: string[] = ['rounded-lg']

  if (!props.noShadow) classParts.push('shadow')
  if (props.ring) {
    classParts.push('ring-outline-2 hover:ring-2')
  }
  if (props.panelClasses) {
    classParts.push(props.panelClasses)
  }

  return classParts.join(' ')
})
</script>

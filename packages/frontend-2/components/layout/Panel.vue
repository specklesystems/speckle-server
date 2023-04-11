<template>
  <div class="relative group">
    <div
      v-if="fancyGlow"
      class="absolute -inset-1 bg-blue-300 dark:bg-blue-500 opacity-10 dark:opacity-5 rounded-md blur-md group-hover:opacity-60 dark:group-hover:opacity-10 transition duration-700"
    ></div>
    <Component
      :is="form ? 'form' : 'div'"
      :class="[
        'relative divide-outline-3 bg-foundation text-foreground flex flex-col divide-y overflow-hidden',
        computedClasses
      ]"
      @submit="emit('submit', $event)"
    >
      <div v-if="$slots.header" class="px-4 py-4 sm:px-6">
        <slot name="header" />
      </div>
      <div class="grow px-4 py-4 sm:p-6">
        <slot />
      </div>
      <div v-if="$slots.footer" class="px-4 py-4 sm:px-6">
        <slot name="footer" />
      </div>
    </Component>
  </div>
</template>
<script setup lang="ts">
import { PropType } from 'vue'

const emit = defineEmits<{ (e: 'submit', val: SubmitEvent): void }>()

type RoundedBorderSize = '2xl' | 'base'

const props = defineProps({
  form: {
    type: Boolean,
    default: false
  },
  roundedBorderSize: {
    type: String as PropType<RoundedBorderSize>,
    default: '2xl'
  },
  fancyGlow: {
    type: Boolean,
    default: false
  }
})

const computedClasses = computed(() => {
  const classParts: string[] = []
  if (!props.fancyGlow) classParts.push('shadow')
  switch (props.roundedBorderSize) {
    case 'base':
      classParts.push('rounded-md')
      break
    case '2xl':
    default:
      classParts.push('rounded-md')
      break
  }

  return classParts.join(' ')
})
</script>

<template>
  <Component
    :is="form ? 'form' : 'div'"
    :class="[
      'divide-y divide-outline-3 overflow-hidden bg-foundation text-foreground shadow flex flex-col',
      computedClasses
    ]"
    @submit="emit('submit', $event)"
  >
    <div v-if="$slots.header" class="px-4 py-4 sm:px-6">
      <slot name="header" />
    </div>
    <div class="px-4 py-4 sm:p-6 grow">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-4 sm:px-6">
      <slot name="footer" />
    </div>
  </Component>
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
  }
})

const computedClasses = computed(() => {
  const classParts: string[] = []

  switch (props.roundedBorderSize) {
    case 'base':
      classParts.push('rounded')
      break
    case '2xl':
    default:
      classParts.push('rounded-2xl')
      break
  }

  return classParts.join(' ')
})
</script>

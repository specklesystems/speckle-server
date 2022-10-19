<template>
  <Component
    :is="to ? NuxtLink : 'a'"
    :to="to"
    :external="external"
    :class="computedClasses"
    @click="onClick"
  >
    <slot>Link</slot>
  </Component>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

const emit = defineEmits<{ (e: 'click', val: MouseEvent): void }>()

const props = defineProps({
  to: {
    type: String as PropType<Optional<string>>,
    required: false,
    default: undefined
  },
  external: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  disabled: {
    type: Boolean as PropType<Optional<boolean>>,
    required: false,
    default: undefined
  },
  secondary: {
    type: Boolean as PropType<Optional<boolean>>,
    default: undefined
  }
})

const NuxtLink = resolveComponent('NuxtLink')
const computedClasses = computed(() => {
  const isSecondary = props.secondary
  const classParts: string[] = ['font-medium']

  if (isSecondary) {
    classParts.push('text-secondary')
  } else {
    classParts.push('text-link')
  }

  if (props.disabled) {
    classParts.push('cursor-not-allowed')
  } else {
    classParts.push('cursor-pointer')

    if (isSecondary) {
      classParts.push('hover:text-secondary-lighter')
    } else {
      classParts.push('hover:text-link-inverted')
    }
  }

  return classParts.join(' ')
})

const onClick = (e: MouseEvent) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    return
  }

  emit('click', e)
}
</script>

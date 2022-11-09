<template>
  <Component
    :is="to ? NuxtLink : 'a'"
    :to="to"
    :external="external"
    :class="computedClasses"
    @click.capture="onClick"
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
  }
})

const NuxtLink = resolveComponent('NuxtLink')
const computedClasses = computed(() => {
  const classParts: string[] = ['font-medium']

  if (props.disabled) {
    classParts.push('text-disabled')
    classParts.push('cursor-not-allowed')
  } else {
    classParts.push('text-primary')
    classParts.push('cursor-pointer')
    classParts.push('hover:text-primary-focus')
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

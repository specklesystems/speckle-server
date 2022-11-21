<template>
  <Component
    :is="to ? NuxtLink : 'a'"
    :to="to"
    :external="external"
    :class="linkClasses"
    role="link"
    @click.capture="onClick"
  >
    <slot>Link</slot>
  </Component>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { Optional } from '@speckle/shared'

type LinkSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl'
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
  size: {
    type: String as PropType<LinkSize>,
    default: 'base'
  }
})

const NuxtLink = resolveComponent('NuxtLink')

// TODO: Composables are similar to FormButton ones, extract to a common one. Or maybe just add this as another variation of "FormButton"?

const typeClasses = computed(() => {
  const classParts: string[] = []

  classParts.push(
    props.disabled
      ? 'text-foreground-disabled'
      : 'text-primary hover:text-primary-focus focus:text-primary-focus'
  )

  return classParts.join(' ')
})

const sizeClasses = computed(() => {
  const classParts: string[] = []

  // weight
  if (props.size === 'xl') {
    classParts.push('font-medium')
  } else {
    classParts.push('font-semibold')
  }

  // font size
  if (['base', 'lg'].includes(props.size)) {
    classParts.push('text-base leading-5')
  } else if (props.size === 'xl') {
    classParts.push('text-lg leading-7')
  } else if (props.size === 'sm') {
    classParts.push('text-sm leading-5')
  } else if (props.size === 'xs') {
    classParts.push('text-xs leading-4')
  }

  return classParts.join(' ')
})

const generalClasses = computed(() => {
  const classParts: string[] = ['outline-none']

  if (props.disabled) {
    classParts.push('cursor-not-allowed')
  } else {
    classParts.push('cursor-pointer')
  }

  return classParts.join(' ')
})

const linkClasses = computed(() =>
  [generalClasses.value, typeClasses.value, sizeClasses.value].join(' ')
)

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

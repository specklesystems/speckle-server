<template>
  <FormButton
    type="link"
    :to="to"
    :external="external"
    :disabled="disabled"
    :size="size"
    role="link"
    @click.capture="onClick"
  >
    <slot>Link</slot>
  </FormButton>
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

<template>
  <FormButton
    :link="underline"
    :text="!underline"
    :to="to"
    :external="external"
    :disabled="disabled"
    :size="size"
    :foreground-link="foregroundLink"
    :icon-left="iconLeft"
    :icon-right="iconRight"
    :hide-text="hideText"
    role="link"
    @click.capture="onClick"
  >
    <slot>Link</slot>
  </FormButton>
</template>
<script setup lang="ts">
import FormButton from '~~/src/components/form/Button.vue'
import type { PropType } from 'vue'
import type { Nullable, Optional } from '@speckle/shared'
import type { PropAnyComponent } from '~~/src/helpers/common/components'

type LinkSize = 'sm' | 'base' | 'lg'
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
  },
  foregroundLink: {
    type: Boolean,
    default: false
  },
  /**
   * Add icon to the left from the text
   */
  iconLeft: {
    type: [Object, Function] as PropType<Nullable<PropAnyComponent>>,
    default: null
  },
  /**
   * Add icon to the right from the text
   */
  iconRight: {
    type: [Object, Function] as PropType<Nullable<PropAnyComponent>>,
    default: null
  },
  /**
   * Hide default slot (when you want to show icons only)
   */
  hideText: {
    type: Boolean,
    default: false
  },
  underline: {
    type: Boolean,
    default: false
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

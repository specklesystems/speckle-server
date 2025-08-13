<template>
  <div>
    <HeadlessDisclosure>
      <DisclosureButton :class="buttonClasses" @click="toggle">
        <div class="inline-flex items-center space-x-2">
          <Component :is="icon" v-if="icon" class="h-5 w-5" />
          <span v-if="!editTitle">{{ title }}</span>
          <FormTextInput
            v-else
            v-bind="bind"
            name="disclosureTitle"
            color="fully-transparent"
            :input-classes="buttonTextClasses"
            v-on="on"
            @click.stop
          />
          <slot name="title-actions" />
        </div>
        <ChevronUpIcon :class="!open ? 'rotate-180 transform' : ''" class="h-5 w-5" />
      </DisclosureButton>
      <DisclosurePanel v-if="open" :class="panelClasses" static>
        <div v-if="!lazyLoad || open" class="label-light">
          <slot>Panel contents</slot>
        </div>
      </DisclosurePanel>
    </HeadlessDisclosure>
  </div>
</template>
<script setup lang="ts">
import {
  DisclosureButton,
  Disclosure as HeadlessDisclosure,
  DisclosurePanel
} from '@headlessui/vue'
import { ChevronUpIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { FormTextInput, useDebouncedTextInput } from '~~/src/lib'

type DisclosureColor = 'default' | 'danger' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    /**
     * HeadlessUI icon component to use
     */
    icon?: PropAnyComponent
    color?: DisclosureColor
    /**
     * Whether to lazy load the panel contents only upon opening
     */
    lazyLoad?: boolean
    /**
     * Whether to enable title editing
     */
    editTitle?: boolean
  }>(),
  {
    color: 'default'
  }
)

const title = defineModel<string>('title')

const open = defineModel<boolean>('open', {
  default: false
})

const { on, bind } = useDebouncedTextInput({
  disableDebouncedInput: true,
  model: title
})

const buttonTextClasses = computed(() => {
  const classParts = ['font-medium']

  switch (props.color) {
    case 'warning':
      classParts.push('text-warning')
      break
    case 'success':
      classParts.push('text-success')
      break
    case 'danger':
      classParts.push('text-danger')
      break
    case 'default':
    default:
      classParts.push('text-primary')
      break
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const classParts = [
    'pr-3 h-10 w-full flex items-center justify-between border-l-2 px-2 rounded transition',
    'ring-1',
    'group/disclosure',
    buttonTextClasses.value
  ]

  switch (props.color) {
    case 'warning':
      classParts.push('border-warning ring-warning-lighter hover:ring-warning')
      break
    case 'success':
      classParts.push('border-success ring-success-lighter hover:ring-success')
      break
    case 'danger':
      classParts.push('border-danger ring-danger-lighter hover:ring-danger')
      break
    case 'default':
    default:
      classParts.push('border-primary ring-primary-muted hover:ring-primary')
      break
  }

  return classParts.join(' ')
})

const panelClasses = computed(() => {
  const classParts = ['p-3 border-x border-b rounded-b-md']

  switch (props.color) {
    case 'warning':
      classParts.push('border-warning-lighter')
      break
    case 'success':
      classParts.push('border-success-lighter')
      break
    case 'danger':
      classParts.push('border-danger-lighter')
      break
    case 'default':
    default:
      classParts.push('border-primary-muted')
      break
  }

  return classParts.join(' ')
})

const toggle = () => {
  open.value = !open.value
}
</script>

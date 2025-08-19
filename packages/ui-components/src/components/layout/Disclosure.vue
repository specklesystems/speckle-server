<template>
  <div>
    <HeadlessDisclosure>
      <DisclosureButton :class="buttonClasses" @click="toggle">
        <div class="inline-flex items-center space-x-2 w-full">
          <Component :is="icon" v-if="icon" class="h-5 w-5" />
          <span v-if="!editTitle" class="text-left w-full">{{ title }}</span>
          <FormTextInput
            v-else
            v-bind="bind"
            name="disclosureTitle"
            color="fully-transparent"
            :input-classes="buttonTextClasses"
            :auto-focus="true"
            v-on="on"
            @click.stop
            @blur="onTitleInputBlur"
          />
          <slot name="title-actions" />
        </div>
        <ChevronUpIcon :class="chevronClasses" />
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
import { computed, watch } from 'vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import { FormTextInput, useDebouncedTextInput } from '~~/src/lib'

type DisclosureColor = 'default' | 'danger' | 'success' | 'warning' | 'subtle'

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
     * If edit mode enabled - it will exit mode when user unfocuses
     */
    exitEditModeOnBlur?: boolean
  }>(),
  {
    color: 'default',
    exitEditModeOnBlur: true
  }
)

const editTitle = defineModel<boolean>('editTitle')
const title = defineModel<string>('title')
const open = defineModel<boolean>('open', {
  default: false
})

const { on, bind, syncFromValue } = useDebouncedTextInput({
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
    case 'subtle':
      classParts.push('text-foreground text-body-2xs')
      break
    case 'default':
    default:
      classParts.push('text-primary')
      break
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  let classParts: string[] = []

  // Common classes shared between subtle and other variants
  classParts = [
    'w-full',
    'flex',
    'items-center',
    'transition',
    'group/disclosure',
    buttonTextClasses.value
  ]

  if (props.color === 'subtle') {
    // Subtle variant specific styling
    classParts.push(
      'h-7',
      'justify-normal',
      'pl-1',
      'pr-0.5',
      'rounded-md',
      'hover:bg-highlight-1',
      'ring-none'
    )
  } else {
    // Default styling for other variants
    classParts.push(
      'pr-3',
      'h-10',
      'justify-between',
      'border-l-2',
      'px-2',
      'rounded',
      'ring-1'
    )
  }

  // Add color-specific styling
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
    case 'subtle':
      classParts.push('border-none ring-none flex-row-reverse gap-x-1 justify-end')
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
    case 'subtle':
      classParts.push('border-none pl-0 pr-0 pb-0 pt-0 rounded-none')
      break
    case 'default':
    default:
      classParts.push('border-primary-muted')
      break
  }

  return classParts.join(' ')
})

const chevronClasses = computed(() => {
  const baseClasses = 'h-4 w-4 transition-transform duration-200 ease-in-out'

  if (props.color === 'subtle') {
    // Subtle variant: 90° when closed, 0° when open
    return open.value
      ? `${baseClasses} rotate-180 transform`
      : `${baseClasses} rotate-90 transform`
  } else {
    // Other variants: rotate when closed (default behavior)
    return !open.value ? `${baseClasses} rotate-180 transform` : baseClasses
  }
})

const toggle = () => {
  open.value = !open.value
}

const onTitleInputBlur = () => {
  if (!props.exitEditModeOnBlur) return

  editTitle.value = false
}

watch(editTitle, (newVal, oldVal) => {
  // Reset input value on turning on edit mode
  if (newVal && !oldVal) {
    syncFromValue()
  }
})
</script>

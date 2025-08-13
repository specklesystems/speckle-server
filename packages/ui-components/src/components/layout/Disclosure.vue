<template>
  <div>
    <HeadlessDisclosure>
      <DisclosureButton :class="buttonClasses" @click="toggle">
        <div class="inline-flex items-center space-x-2">
          <Component :is="icon" v-if="icon" class="h-5 w-5" />
          <span>{{ title }}</span>
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

type DisclosureColor = 'default' | 'danger' | 'success' | 'warning'

const props = withDefaults(
  defineProps<{
    title: string
    /**
     * HeadlessUI icon component to use
     */
    icon?: PropAnyComponent
    color?: DisclosureColor
    /**
     * Whether to lazy load the panel contents only upon opening
     */
    lazyLoad?: boolean
  }>(),
  {
    color: 'default'
  }
)

const open = defineModel<boolean>('open', {
  default: false
})

const buttonClasses = computed(() => {
  const classParts = [
    'pr-3 h-10 w-full flex items-center justify-between border-l-2 px-2 rounded transition',
    'ring-1 font-medium',
    'group/disclosure'
  ]

  switch (props.color) {
    case 'warning':
      classParts.push(
        'border-warning text-warning ring-warning-lighter hover:ring-warning'
      )
      break
    case 'success':
      classParts.push(
        'border-success text-success ring-success-lighter hover:ring-success'
      )
      break
    case 'danger':
      classParts.push('border-danger text-danger ring-danger-lighter hover:ring-danger')
      break
    case 'default':
    default:
      classParts.push(
        'border-primary text-primary ring-primary-muted hover:ring-primary'
      )
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

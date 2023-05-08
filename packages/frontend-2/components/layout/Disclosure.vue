<template>
  <div>
    <Disclosure v-slot="{ open }">
      <DisclosureButton :class="buttonClasses">
        <div class="inline-flex items-center space-x-2">
          <Component :is="icon" v-if="icon" class="h-4 w-4" />
          <span>{{ title }}</span>
        </div>
        <ChevronUpIcon :class="!open ? 'rotate-180 transform' : ''" class="h-5 w-5" />
      </DisclosureButton>
      <DisclosurePanel :class="panelClasses">
        <div class="label-light">
          <slot>Panel contents</slot>
        </div>
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>
<script setup lang="ts">
import { DisclosureButton, Disclosure, DisclosurePanel } from '@headlessui/vue'
import { ChevronUpIcon } from '@heroicons/vue/24/solid'
import { ConcreteComponent } from 'vue'

type DisclosureColor = 'default' | 'danger'

const props = withDefaults(
  defineProps<{
    title: string
    icon?: ConcreteComponent
    color?: DisclosureColor
  }>(),
  {
    color: 'default'
  }
)

const buttonClasses = computed(() => {
  const classParts = [
    'pr-3 h-10 w-full flex items-center justify-between border-l-2 px-2 rounded transition',
    'ring-1'
  ]

  switch (props.color) {
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
  const classParts = ['mt-4 px-3 py-1 border-x ']

  switch (props.color) {
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
</script>

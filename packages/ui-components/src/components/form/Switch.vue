<template>
  <div class="flex items-center gap-2">
    <HeadlessSwitch
      :id="id || name"
      v-model="enabled"
      :class="switchClasses"
      :name="name"
      :disabled="disabled"
    >
      <div class="absolute inset-0 flex items-center gap-2 px-1 text-white">
        <CheckIcon
          class="h-5 w-5 drop-shadow-md"
          :class="icons ? 'opacity-100' : 'opacity-0'"
        />
        <XMarkIcon
          class="h-5 w-5 drop-shadow-md"
          :class="icons ? 'opacity-100' : 'opacity-0'"
        />
      </div>
      <span :class="sliderClasses"></span>
    </HeadlessSwitch>
    <label :for="id || name" :class="labelClasses">
      <span>{{ title }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { Switch as HeadlessSwitch } from '@headlessui/vue'
import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    icons?: boolean
    showLabel?: boolean
    name: string
    label?: string
    disabled?: boolean
    id?: string
  }>(),
  {
    showLabel: true
  }
)

const enabled = defineModel<boolean>()

const title = computed(() => props.label || props.name)

const labelClasses = computed(() => {
  const classParts = ['block label-light']

  if (!props.showLabel) {
    classParts.push('sr-only')
  }

  return classParts.join(' ')
})

const switchClasses = computed(() => {
  const classParts = [
    'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full',
    'transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
    'cursor-pointer disabled:cursor-not-allowed disabled:bg-foundation-disabled'
  ]

  if (enabled.value) {
    classParts.push('bg-primary')
  } else {
    classParts.push('bg-primary-muted')
  }

  return classParts.join(' ')
})

const sliderClasses = computed(() => {
  const classParts = [
    'scale-95 pointer-events-none inline-block h-5 w-5 rounded-full',
    'shadow transform ring-0 transition ease-in-out duration-200'
  ]

  if (props.disabled) {
    classParts.push('bg-foreground-disabled')
  } else {
    classParts.push('bg-white')
  }

  if (enabled.value) {
    classParts.push('translate-x-5')
  } else {
    classParts.push('translate-x-0')
  }

  return classParts.join(' ')
})
</script>

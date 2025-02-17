<template>
  <div class="flex items-center space-x-2">
    <HeadlessSwitch
      :id="id || name"
      v-model="enabled"
      :class="switchClasses"
      :name="name"
      :disabled="disabled"
    >
      <span :class="sliderClasses"></span>
    </HeadlessSwitch>
    <label :for="id || name" :class="labelClasses">
      <span>{{ title }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { Switch as HeadlessSwitch } from '@headlessui/vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
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
    'relative inline-flex flex-shrink-0 h-[18px] w-[30px] rounded-full',
    'transition-colors ease-in-out duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
    'cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'
  ]

  if (enabled.value) {
    classParts.push('bg-primary')
  } else {
    classParts.push('bg-foreground-3')
  }

  return classParts.join(' ')
})

const sliderClasses = computed(() => {
  const classParts = [
    'pointer-events-none inline-block h-3 w-3 rounded-full mt-[3px] ml-[3px]',
    'ring-0 transition ease-in-out duration-200 bg-foreground-on-primary'
  ]

  if (enabled.value) {
    classParts.push('translate-x-[12px]')
  } else {
    classParts.push('translate-x-0')
  }

  return classParts.join(' ')
})
</script>

<template>
  <div :class="classes">
    <img v-if="finalLogo" :src="finalLogo" alt="Function logo" class="h-10 w-10" />
    <span v-else :class="fallbackIconClasses">λ</span>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { cleanFunctionLogo } from '~/lib/automate/helpers/functions'

type Size = 'base' | 'xs'

const props = withDefaults(
  defineProps<{
    logo?: MaybeNullOrUndefined<string>
    size?: Size
  }>(),
  {
    size: 'base'
  }
)

const finalLogo = computed(() => cleanFunctionLogo(props.logo))
const classes = computed(() => {
  const classParts = [
    'bg-foundation-focus text-primary font-medium rounded-full shrink-0 flex justify-center text-center items-center overflow-hidden select-none'
  ]

  switch (props.size) {
    case 'xs':
      classParts.push('h-4 w-4')
      break
    case 'base':
    default:
      classParts.push('h-10 w-10')
      break
  }

  return classParts.join(' ')
})

const fallbackIconClasses = computed(() => {
  const classParts: string[] = []

  switch (props.size) {
    case 'xs':
      classParts.push('text-xs')
      break
  }

  return classParts.join(' ')
})
</script>

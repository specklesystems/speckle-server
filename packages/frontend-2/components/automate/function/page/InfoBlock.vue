<template>
  <div :class="wrapperClasses">
    <div class="flex items-center gap-2 py-2 border-b border-outline-3 mb-4">
      <Component :is="icon" class="w-5 h-5" />
      <h3 class="h5 font-bold">{{ title }}</h3>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropAnyComponent } from '@speckle/ui-components'

const props = withDefaults(
  defineProps<{
    icon: PropAnyComponent
    title: string
    roundedTop?: boolean
    roundedBottom?: boolean
    horizontalPadding?: 'px-2' | 'px-4'
  }>(),
  {
    roundedTop: true,
    roundedBottom: true,
    horizontalPadding: 'px-2'
  }
)

const wrapperClasses = computed(() => {
  const classParts = ['pb-4 bg-foundation basis-1/2 shrink-0 grow-0']

  if (props.roundedTop && props.roundedBottom) {
    classParts.push('rounded-lg')
  } else if (props.roundedTop) {
    classParts.push('rounded-t-lg')
  } else if (props.roundedBottom) {
    classParts.push('rounded-b-lg')
  }

  classParts.push(props.horizontalPadding)

  return classParts.join(' ')
})
</script>

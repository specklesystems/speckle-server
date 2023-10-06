<template>
  <ArrowPathIcon :class="iconClasses" />
</template>
<script setup lang="ts">
import { ArrowPathIcon } from '@heroicons/vue/24/solid'
import { computed } from 'vue'

type Size = 'base' | 'sm' | 'lg'

const props = withDefaults(defineProps<{ loading?: boolean; size?: Size }>(), {
  size: 'base',
  loading: true
})

const iconClasses = computed(() => {
  const classParts: string[] = ['text-primary transition-all animate-spin']
  classParts.push(props.loading ? 'opacity-100' : 'opacity-0')

  switch (props.size) {
    case 'base':
      classParts.push('h-8 w-8')
      break
    case 'sm':
      classParts.push('h-5 w-5')
      break
    case 'lg':
      classParts.push('h-12 w-12')
      break
  }

  return classParts.join(' ')
})
</script>

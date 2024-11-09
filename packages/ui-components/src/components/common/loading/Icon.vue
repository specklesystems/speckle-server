<template>
  <svg
    class="spinner"
    :class="iconClasses"
    width="32px"
    height="40px"
    viewBox="0 0 66 66"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      class="path"
      fill="none"
      stroke="currentColor"
      stroke-width="6"
      stroke-linecap="round"
      cx="33"
      cy="33"
      r="30"
    ></circle>
  </svg>
</template>
<script setup lang="ts">
import { computed } from 'vue'

type Size = 'base' | 'sm' | 'lg'

const props = withDefaults(defineProps<{ loading?: boolean; size?: Size }>(), {
  size: 'base',
  loading: true
})

const iconClasses = computed(() => {
  const classParts: string[] = ['']
  classParts.push(props.loading ? 'opacity-100' : 'opacity-0')

  switch (props.size) {
    case 'base':
      classParts.push('h-5 w-5')
      break
    case 'sm':
      classParts.push('h-4 w-4')
      break
    case 'lg':
      classParts.push('h-8 w-8')
      break
  }

  return classParts.join(' ')
})
</script>

<style scoped>
@keyframes rotator {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(270deg);
  }
}

@keyframes dash {
  0% {
    stroke-dashoffset: 187;
  }
  50% {
    stroke-dashoffset: 46.75;
    transform: rotate(135deg);
  }
  100% {
    stroke-dashoffset: 187;
    transform: rotate(450deg);
  }
}

.spinner {
  animation: rotator 1.4s linear infinite;
}

.path {
  stroke-dasharray: 187;
  stroke-dashoffset: 0;
  transform-origin: center;
  animation: dash 1.4s ease-in-out infinite;
}
</style>

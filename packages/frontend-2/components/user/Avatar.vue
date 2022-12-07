<template>
  <div :class="['shrink-0 rounded-full overflow-hidden', computedClasses]">
    <img v-if="avatarUrl" class="w-full h-full" :src="avatarUrl" alt="User avatar" />
    <UserCircleIcon class="w-full h-full scale-150" />
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/24/solid'

type AvatarSize = 'sm' | 'xs'

const props = defineProps<{
  avatarUrl?: string | null
  size?: AvatarSize
  noBorder?: boolean
}>()

const computedClasses = computed(() => {
  const classParts: string[] = []

  const size = props.size || 'sm'
  switch (size) {
    case 'xs':
      classParts.push('h-6 w-6')
      if (!props.noBorder) classParts.push('border border-outline-1')

      break
    case 'sm':
    default:
      classParts.push('h-8 w-8')
      if (!props.noBorder) classParts.push('border-2 border-outline-1')
      break
  }

  return classParts.join(' ')
})
</script>

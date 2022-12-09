<template>
  <div :class="['shrink-0 rounded-full overflow-hidden', computedClasses]">
    <div
      v-if="avatarUrl"
      class="bg-no-repeat bg-center bg-cover w-full h-full"
      :style="{ backgroundImage: `url('${avatarUrl}')` }"
    />
    <UserCircleIcon v-else class="w-full h-full scale-150 text-foreground" />
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/24/solid'

type AvatarSize = '32' | '24' | '20'

const props = defineProps<{
  avatarUrl?: string | null
  size?: AvatarSize
  noBorder?: boolean
}>()

const computedClasses = computed(() => {
  const classParts: string[] = []

  const size = props.size || 'sm'
  switch (size) {
    case '20':
      classParts.push('h-5 w-5')
      if (!props.noBorder) classParts.push('border border-outline-1')
      break
    case '24':
      classParts.push('h-6 w-6')
      if (!props.noBorder) classParts.push('border border-outline-1')
      break
    case '32':
    default:
      classParts.push('h-8 w-8')
      if (!props.noBorder) classParts.push('border-2 border-outline-1')
      break
  }

  return classParts.join(' ')
})
</script>

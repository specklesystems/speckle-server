<template>
  <div
    :class="[
      'shrink-0 rounded-full overflow-hidden border-2 border-foundation bg-primary flex items-center justify-center uppercase text-xs font-semibold text-foreground-on-primary transition',
      sizeClasses,
      hoverClasses
    ]"
  >
    <slot>
      <div
        v-if="user?.avatar"
        class="bg-no-repeat bg-center bg-cover w-full h-full"
        :style="{ backgroundImage: `url('${user.avatar}')` }"
      />
      <div
        v-else-if="initials"
        class="w-full h-full flex items-center justify-center select-none"
      >
        {{ initials }}
      </div>
      <div v-else>
        <UserCircleIcon class="w-5 h-5" />
      </div>
    </slot>
  </div>
</template>
<script setup lang="ts">
import { UserCircleIcon } from '@heroicons/vue/24/solid'

const props = withDefaults(
  defineProps<{
    user?: { id: string; name: string; avatar?: string | null | undefined } // wtf mr. avatar
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
    hoverEffect?: boolean
  }>(),
  {
    size: 'base',
    hoverEffect: false,
    user: undefined
  }
)

const initials = computed(() => {
  if (!props.user) return
  const parts = props.user?.name.split(' ')
  return parts[0][0] + parts[1][0] || ''
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-5 w-5'
    case 'sm':
      return 'h-6 w-6'
    case 'lg':
      return 'h-10 w-10'
    case 'xl':
      return 'h-14 w-14'
    case 'base':
    default:
      return 'h-8 w-8'
  }
})

const hoverClasses = computed(() => {
  if (props.hoverEffect)
    return 'hover:border-primary focus:border-primary active:scale-95'
  return ''
})

// const { sizeBorderClasses } = useUserAvatarInternalsparams({ props: toRefs(props) })
</script>

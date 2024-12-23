<template>
  <component
    :is="isButton ? 'div' : 'button'"
    :class="[
      'flex shrink-0 overflow-hidden rounded-md border border-outline-2 bg-foundation-2',
      sizeClasses
    ]"
  >
    <div
      class="h-full w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      :style="logo ? { backgroundImage: `url('${logo}')` } : undefined"
    >
      <span v-if="!logo" class="text-foreground-3 uppercase leading-none">
        {{ name[0] }}
      </span>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { type UserAvatarSize, useAvatarSizeClasses } from '@speckle/ui-components'

const props = withDefaults(
  defineProps<{
    size?: UserAvatarSize
    logo: MaybeNullOrUndefined<string>
    name: string
    isButton?: boolean
  }>(),
  {
    size: 'base'
  }
)

const { sizeClasses } = useAvatarSizeClasses({ props: toRefs(props) })
</script>

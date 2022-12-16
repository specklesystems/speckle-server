<template>
  <NuxtLink
    :class="[
      'shrink-0 rounded-full inline-flex justify-center items-center',
      sizeBorderClasses
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </NuxtLink>
</template>
<script setup lang="ts">
import {
  AvatarSize,
  useUserAvatarInternalsparams
} from '~~/lib/user/composables/avatar'

defineEmits<{
  (e: 'click', v: MouseEvent): void
}>()

const props = defineProps<{
  size?: AvatarSize
  noBorder?: boolean
}>()

const { sizeBorderClasses } = useUserAvatarInternalsparams({ props: toRefs(props) })
</script>

<template>
  <NuxtLink
    :class="[
      'shrink-0 rounded-full inline-flex justify-center items-center cursor-pointer',
      sizeBorderClasses
    ]"
    @click="$emit('click', $event)"
  >
    <PlusIcon class="w-4 h-4 text-outline-1" />
  </NuxtLink>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'
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

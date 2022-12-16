<template>
  <div :class="['shrink-0 rounded-full overflow-hidden', sizeBorderClasses]">
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
import {
  AvatarSize,
  useUserAvatarInternalsparams
} from '~~/lib/user/composables/avatar'

const props = defineProps<{
  avatarUrl?: string | null
  size?: AvatarSize
  noBorder?: boolean
}>()

const { sizeBorderClasses } = useUserAvatarInternalsparams({ props: toRefs(props) })
</script>

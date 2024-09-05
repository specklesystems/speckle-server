<template>
  <div
    :class="[
      'text-foreground-on-primary flex shrink-0 items-center justify-center overflow-hidden rounded-full uppercase transition',
      sizeClasses
    ]"
  >
    <div
      class="h-full w-full bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url('${avatar}')` }"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { UserAvatarSize } from '@speckle/ui-components'
import { useAvatarSizeClasses } from '@speckle/ui-components'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'

graphql(`
  fragment WorkspaceAvatar_Workspace on Workspace {
    id
    logo
    defaultLogoIndex
  }
`)

const props = withDefaults(
  defineProps<{
    size?: UserAvatarSize
    logo?: MaybeNullOrUndefined<string>
    defaultLogoIndex: number
  }>(),
  {
    size: 'base'
  }
)

const { sizeClasses } = useAvatarSizeClasses({ props: toRefs(props) })
const { getDefaultAvatar } = useWorkspacesAvatar()

const avatar = computed(() =>
  props.logo ? props.logo : getDefaultAvatar(props.defaultLogoIndex)
)
</script>

<template>
  <component
    :is="logo ? 'div' : 'button'"
    v-tippy="logo ? undefined : 'Add a workspace icon'"
    :class="[
      'flex shrink-0 overflow-hidden rounded-md border border-outline-2 bg-foundation-2',
      sizeClasses
    ]"
    @click="logo ? undefined : openSettingsDialog(SettingMenuKeys.Workspace.General)"
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
import {
  type AvailableSettingsMenuKeys,
  SettingMenuKeys
} from '~/lib/settings/helpers/types'

const emit = defineEmits<{
  (e: 'show-settings-dialog', v: AvailableSettingsMenuKeys): void
}>()

const props = withDefaults(
  defineProps<{
    size?: UserAvatarSize
    logo: MaybeNullOrUndefined<string>
    name: string
  }>(),
  {
    size: 'base'
  }
)

const { sizeClasses } = useAvatarSizeClasses({ props: toRefs(props) })

const openSettingsDialog = (target: AvailableSettingsMenuKeys) => {
  emit('show-settings-dialog', target)
}
</script>

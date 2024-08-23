<template>
  <UserAvatarEditable
    v-model:edit-mode="editMode"
    :model-value="workspace.logo"
    :placeholder="workspace.name"
    :default-img="defaultAvatar"
    name="edit-avatar"
    :disabled="loading"
    :size="size"
    @save="onSave"
  />
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { SettingsWorkspacesGeneralEditAvatar_WorkspaceFragment } from '~~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { UserAvatarSize } from '@speckle/ui-components/dist/composables/user/avatar'
import { useUpdateWorkspace } from '~~/lib/settings/composables/management'
import { useWorkspacesAvatar } from '~~/lib/workspaces/composables/avatar'

graphql(`
  fragment SettingsWorkspacesGeneralEditAvatar_Workspace on Workspace {
    id
    logo
    name
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesGeneralEditAvatar_WorkspaceFragment
  size: UserAvatarSize
}>()

const { mutate, loading } = useUpdateWorkspace()
const { defaultAvatar } = useWorkspacesAvatar()

const editMode = ref(false)

const onSave = async (newVal: MaybeNullOrUndefined<string>) => {
  if (props.workspace.logo === newVal) return
  if (loading.value) return

  await mutate({
    id: props.workspace.id,
    logo: newVal || ''
  })
  editMode.value = false
}
</script>

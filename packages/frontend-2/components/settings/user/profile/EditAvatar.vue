<template>
  <UserAvatarEditable
    v-model:edit-mode="editMode"
    :model-value="user.avatar"
    :placeholder="user.name"
    name="edit-avatar"
    :disabled="loading"
    :size="size"
    @save="onSave"
  />
</template>
<script setup lang="ts">
import type { UserProfileEditDialogAvatar_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { UserAvatarSize } from '@speckle/ui-components/dist/composables/user/avatar'

graphql(`
  fragment UserProfileEditDialogAvatar_User on User {
    id
    avatar
    ...ActiveUserAvatar
  }
`)

const props = defineProps<{
  user: UserProfileEditDialogAvatar_UserFragment
  size: UserAvatarSize
}>()

const editMode = ref(false)
const { mutate, loading } = useUpdateUserProfile()

const onSave = async (newVal: MaybeNullOrUndefined<string>) => {
  if (props.user.avatar === newVal) return
  if (loading.value) return

  await mutate({
    avatar: newVal || ''
  })
  editMode.value = false
}
</script>

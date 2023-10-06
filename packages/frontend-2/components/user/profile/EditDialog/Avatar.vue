<template>
  <UserAvatarEditable :user="user" :disabled="loading" @save="onSave" />
</template>
<script setup lang="ts">
import { UserProfileEditDialogAvatar_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'
import { Nullable } from '@speckle/shared'

graphql(`
  fragment UserProfileEditDialogAvatar_User on User {
    id
    avatar
    ...ActiveUserAvatar
  }
`)

const props = defineProps<{
  user: UserProfileEditDialogAvatar_UserFragment
}>()

const { mutate, loading } = useUpdateUserProfile()

const onSave = async (newVal: Nullable<string>) => {
  if (props.user.avatar === newVal) return
  if (loading.value) return

  await mutate({
    avatar: newVal || ''
  })
}
</script>

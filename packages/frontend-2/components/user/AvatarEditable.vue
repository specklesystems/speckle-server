<template>
  <div class="flex justify-center">
    <UserAvatarEditor
      v-if="editMode"
      :user="user"
      @cancel="editMode = false"
      @save="onSave"
    />
    <div v-else class="relative group">
      <UserAvatar :user="user" size="editable" />
      <div
        class="opacity-0 transition-all absolute group-hover:opacity-100 inset-0 flex items-end justify-center bottom-4"
      >
        <FormButton color="secondary" :disabled="loading" @click="editMode = true">
          Change
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { UserAvatarEditable_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'

graphql(`
  fragment UserAvatarEditable_User on User {
    id
    avatar
    ...ActiveUserAvatar
  }
`)

const props = defineProps<{
  user: UserAvatarEditable_UserFragment
}>()

const { mutate, loading } = useUpdateUserProfile()

const editMode = ref(false)

/**
 * TODO:
 *  - Move save to inside AvatarEditor
 *  - Catch image too big errors and report human readable versions
 */
const onSave = async (newUrl: Nullable<string>) => {
  if (props.user.avatar === newUrl) return

  editMode.value = false
  await mutate({
    avatar: newUrl
  })
}
</script>

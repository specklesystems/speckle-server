<template>
  <div class="flex justify-center">
    <LazyUserAvatarEditor
      v-if="editMode"
      :user="user"
      @cancel="editMode = false"
      @save="editMode = false"
    />
    <div v-else class="relative group">
      <UserAvatar :user="user" :size="size ? size : 'editable'" />
      <div
        class="opacity-0 transition-all absolute group-hover:opacity-100 inset-0 flex items-end justify-center bottom-4"
      >
        <FormButton color="secondary" @click="editMode = true">Change</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { UserAvatarSize } from '~~/lib/user/composables/avatar'
import { graphql } from '~~/lib/common/generated/gql'
import { UserAvatarEditable_UserFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment UserAvatarEditable_User on User {
    id
    avatar
    ...ActiveUserAvatar
  }
`)

defineProps<{
  user: UserAvatarEditable_UserFragment
  size?: UserAvatarSize
}>()

const editMode = ref(false)
</script>

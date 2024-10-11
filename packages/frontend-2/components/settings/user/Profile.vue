<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Profile" text="Manage your profile" />
      <SettingsUserProfileDetails :user="user" />
      <hr class="my-6 md:my-8 border-outline-2" />
      <SettingsUserProfileChangePassword :user="user" />
      <hr class="my-6 md:my-8 border-outline-2" />
      <SettingsUserProfileDeleteAccount :user="user" />
      <hr class="my-6 md:my-8 border-outline-2" />
      <div class="text-xs text-foreground-2 w-full flex flex-col space-y-2">
        <div class="flex">
          User ID: #{{ user.id }}
          <ClipboardIcon
            class="w-4 h-4 ml-2 cursor-pointer hover:text-foreground transition"
            @click="copyUserId"
          />
        </div>
        <div v-if="distinctId" class="flex">
          {{ distinctId }}
          <ClipboardIcon
            class="w-4 h-4 ml-2 cursor-pointer hover:text-foreground transition"
            @click="copyDistinctId"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { SettingsUserProfile_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import { ClipboardIcon } from '@heroicons/vue/24/outline'

graphql(`
  fragment SettingsUserProfile_User on User {
    ...SettingsUserProfileChangePassword_User
    ...SettingsUserProfileDeleteAccount_User
    ...SettingsUserProfileDetails_User
  }
`)

const { distinctId } = useActiveUser()

const props = defineProps<{
  user: SettingsUserProfile_UserFragment
}>()

const { copy } = useClipboard()

const copyUserId = () => {
  copy(props.user.id)
}

const copyDistinctId = () => {
  if (distinctId.value) {
    copy(distinctId.value)
  }
}
</script>

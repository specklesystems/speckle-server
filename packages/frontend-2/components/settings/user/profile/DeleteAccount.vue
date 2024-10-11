<template>
  <div>
    <SettingsUserProfileDeleteAccountDialog
      v-model:open="showDeleteDialog"
      :user="user"
    />
    <div class="flex flex-col space-y-6">
      <SettingsSectionHeader title="Delete account" subheading />
      <CommonCard class="bg-foundation">
        We will delete all projects where you are the sole owner, and any associated
        data. We will ask you to type in your email address and press the delete button.
      </CommonCard>
      <div>
        <FormButton @click="toggleDeleteDialog">Delete account</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SettingsUserProfileDeleteAccount_UserFragment } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  user: SettingsUserProfileDeleteAccount_UserFragment
}>()

const showDeleteDialog = ref(false)

function toggleDeleteDialog() {
  showDeleteDialog.value = true
}
</script>

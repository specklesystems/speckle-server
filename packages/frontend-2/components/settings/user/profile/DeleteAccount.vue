<template>
  <div>
    <SettingsUserProfileDeleteAccountDialog
      v-model:open="showDeleteDialog"
      :user="user"
    />
    <div class="flex flex-col space-y-6">
      <SettingsSectionHeader title="Delete account" subheading />
      <div
        class="rounded border bg-foundation-page border-outline-3 text-body-xs text-foreground py-4 px-6"
      >
        We will delete all projects where you are the sole owner, and any associated
        data. We will ask you to type in your email address and press the delete button.
      </div>
      <div>
        <FormButton color="danger" @click="toggleDeleteDialog">
          Delete account
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserProfileEditDialogDeleteAccount_UserFragment } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  user: UserProfileEditDialogDeleteAccount_UserFragment
}>()

const showDeleteDialog = ref(false)

function toggleDeleteDialog() {
  showDeleteDialog.value = true
}
</script>

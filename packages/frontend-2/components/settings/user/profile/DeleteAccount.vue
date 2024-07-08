<template>
  <div>
    <SettingsUserProfileDeleteAccountDialog v-model:open="isOpen" :user="user" />
    <div class="flex flex-col space-y-6">
      <SettingsSectionHeader title="Delete Account" subheading />
      <div class="rounded border bg-foundation-page border-outline-3 text-sm py-4 px-6">
        We will delete all projects where you are the sole owner, and any associated
        data. We will ask you to type in your email address and press the delete button.
      </div>
      <div>
        <FormButton color="danger" @click="toggleModal">Delete Account</FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { activeUser: user } = useActiveUser()
const isOpen = ref(false)

function toggleModal() {
  isOpen.value = !isOpen.value
}
</script>

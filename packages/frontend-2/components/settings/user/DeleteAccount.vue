<template>
  <div>
    <SettingsUserDeleteAccountDialog v-model:open="isOpen" :user="user" />
    <div class="flex flex-col space-y-6">
      <h2 class="text-xl">Delete account</h2>
      <CommonAlert color="info" size="sm" hide-icon>
        <template #description>
          We will delete all projects where you are the sole owner, and any associated
          data. We will ask you to type in your email address and press the delete
          button.
        </template>
      </CommonAlert>
      <div>
        <FormButton color="default" @click="toggleModal">Delete account</FormButton>
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

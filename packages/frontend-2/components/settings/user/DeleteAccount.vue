<template>
  <div>
    <SettingsUserDeleteAccountDialog v-model:open="isOpen" :user="user" />
    <div class="flex flex-col space-y-6">
      <h2 class="h5">Delete account</h2>
      <div class="p-4 bg-foundation border border-gray-300 rounded">
        <p class="text-sm">
          We will delete all projects where you are the sole owner, and any associated
          data. We will ask you to type in your email address and press the delete
          button.
        </p>
      </div>
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

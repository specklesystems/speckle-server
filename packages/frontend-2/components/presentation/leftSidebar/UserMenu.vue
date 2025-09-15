<template>
  <div
    class="flex items-center justify-between w-full h-14 border-t border-outline-3 p-3"
  >
    <UserAvatar :user="activeUser" />
    <FormButton
      class="size-4 text-foreground"
      color="subtle"
      :icon-left="LucideLogOut"
      hide-text
      @click="logout({ skipRedirect: false })"
    >
      Log out
    </FormButton>
  </div>
</template>

<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { LucideLogOut } from 'lucide-vue-next'
import { useAuthManager } from '~~/lib/auth/composables/auth'

const { activeUser } = useActiveUser()
const { logout } = useAuthManager()
</script>

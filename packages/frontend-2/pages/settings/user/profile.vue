<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink :to="'/downloads'" name="Speckle Connectors"></HeaderNavLink>
    </Portal>
    <SettingsDebug />
    <div class="md:max-w-xl md:mx-auto md:py-12">
      <h1 class="h2">Profile</h1>
      <div class="flex flex-col gap-y-8 mt-4">
        <p>Manage your profile information</p>
        <hr />
        <SettingsUserDetails :user="user" />
        <hr />
        <SettingsUserPassword :user="user" />
        <hr />
        <SettingsUserDeleteAccount :user="user" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~/lib/auth/composables/activeUser'

useHead({
  title: 'Settings - User Profile'
})

const { activeUser: user } = useActiveUser()
</script>

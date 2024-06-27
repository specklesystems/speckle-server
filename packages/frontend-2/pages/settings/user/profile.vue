<template>
  <div>
    <Portal to="navigation" />
    <SettingsDebug />
    <div class="md:max-w-xl md:mx-auto md:py-12">
      <SettingsUserProfile :user="user" />
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

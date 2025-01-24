<template>
  <ul
    class="flex flex-col border border-outline-2 rounded-lg divide-y divide-outline-2"
  >
    <li v-for="email in emails" :key="email.id">
      <SettingsUserEmailListItem :email-data="email" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useUserEmails } from '~/lib/user/composables/emails'

const { emails } = useUserEmails()
</script>

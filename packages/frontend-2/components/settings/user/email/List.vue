<template>
  <ul
    class="flex flex-col border border-outline-2 rounded-lg divide-y divide-outline-2"
  >
    <li v-for="email in sortedEmails" :key="email.id">
      <SettingsUserEmailListItem :email-data="email" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useUserEmails } from '~/lib/user/composables/emails'
import { sortBy } from 'lodash-es'

const { emails } = useUserEmails()

const sortedEmails = computed(() =>
  sortBy(emails.value, [(email) => !email.primary, 'email'])
)
</script>

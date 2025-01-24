<template>
  <ul class="flex flex-col">
    <SettingsUserEmailListItem
      v-for="email in emailData"
      :key="email.id"
      :email-data="email"
    />
  </ul>
</template>

<script setup lang="ts">
import type { UserEmail } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  emailData: UserEmail[]
}>()
</script>

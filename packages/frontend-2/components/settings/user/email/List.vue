<template>
  <ul class="flex flex-col">
    <SettingsUserEmailListItem
      v-for="email in emailData"
      :key="email.id"
      :email-data="email"
      @delete="onDelete(email.id, email.email)"
      @set-primary="onSetPrimary(email.id, email.email)"
    />
  </ul>
</template>

<script setup lang="ts">
import type { SettingsUserEmailCards_UserEmailFragment } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  emailData: SettingsUserEmailCards_UserEmailFragment[]
}>()

const emit = defineEmits<{
  (e: 'delete', id: string, email: string): void
  (e: 'set-primary', id: string, email: string): void
}>()

const onDelete = (id: string, email: string) => {
  emit('delete', id, email)
}

const onSetPrimary = (id: string, email: string) => {
  emit('set-primary', id, email)
}
</script>

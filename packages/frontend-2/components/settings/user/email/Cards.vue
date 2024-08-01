<template>
  <ul class="flex flex-col">
    <SettingsUserEmailCard
      v-for="(email, index) in emailData"
      :key="`email-${index}`"
      :email-data="email"
      @delete="onDelete(email.id, email.email)"
      @set-primary="onSetPrimary(email.id, email.email)"
    />
  </ul>
</template>

<script setup lang="ts">
import type { SettingsUserEmailCards_UserEmailFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

graphql(`
  fragment SettingsUserEmailCards_UserEmail on UserEmail {
    email
    id
    primary
    verified
  }
`)

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

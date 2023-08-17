<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <div v-if="user" class="flex flex-col text-foreground space-y-4">
      <UserProfileEditDialogBio :user="user" />
      <UserProfileEditDialogNotificationPreferences :user="user" />
      <UserProfileEditDialogChangePassword :user="user" />
      <UserProfileEditDialogDeleteAccount :user="user" @deleted="isOpen = false" />
      <div class="text-tiny text-foreground-2">User #{{ user.id }}</div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { profileEditDialogQuery } from '~~/lib/user/graphql/queries'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { result } = useQuery(profileEditDialogQuery)
const user = computed(() => result.value?.activeUser)

const isOpen = computed({
  get: () => !!(props.open && user.value),
  set: (newVal) => emit('update:open', newVal)
})
</script>

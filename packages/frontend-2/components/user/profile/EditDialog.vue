<template>
  <LayoutDialog v-model:open="isOpen" max-height title="Edit Profile" max-width="md">
    <div v-if="user" class="flex flex-col text-foreground">
      <UserProfileEditDialogBio :user="user" />
      <UserProfileEditDialogNotificationPreferences :user="user" />
      <div class="flex justify-between items-center py-4 px-3 border-t border-b mb-5">
        <div class="flex items-center gap-2">
          <CodeBracketIcon class="w-5 h-5" />
          <span class="font-bold leading-tight">Developer Settings</span>
        </div>
        <FormButton size="sm" to="/developer-settings/" @click="isOpen = false">
          Open Developer Settings
        </FormButton>
      </div>
      <div class="flex flex-col gap-3 mb-4">
        <UserProfileEditDialogChangePassword :user="user" />
        <UserProfileEditDialogDeleteAccount :user="user" @deleted="isOpen = false" />
      </div>
      <div class="text-tiny text-foreground-2">User #{{ user.id }}</div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { CodeBracketIcon } from '@heroicons/vue/24/outline'
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

<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <template #header>Edit Profile</template>
    <div v-if="user" class="flex flex-col text-foreground">
      <UserProfileEditDialogBio :user="user" />
      <UserProfileEditDialogNotificationPreferences :user="user" />
      <LayoutDialogSection
        title="Developer Settings"
        :button="developerSettingsButton"
        border-b
      >
        <template #icon>
          <CodeBracketIcon class="h-full w-full" />
        </template>
      </LayoutDialogSection>
      <UserProfileEditDialogChangePassword :user="user" />
      <UserProfileEditDialogDeleteAccount :user="user" @deleted="isOpen = false" />
      <div class="text-tiny text-foreground-2 mt-4">User #{{ user.id }}</div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CodeBracketIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'

type FormButtonColor =
  | 'default'
  | 'invert'
  | 'danger'
  | 'warning'
  | 'success'
  | 'card'
  | 'secondary'
  | 'info'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { activeUser: user } = useActiveUser()

const isOpen = computed({
  get: () => !!(props.open && user.value),
  set: (newVal) => emit('update:open', newVal)
})

const developerSettingsButton = computed(() => ({
  text: 'Manage',
  color: 'default' as FormButtonColor,
  to: '/developer-settings/',
  iconRight: ChevronRightIcon,
  onClick: () => {
    isOpen.value = false
  }
}))
</script>

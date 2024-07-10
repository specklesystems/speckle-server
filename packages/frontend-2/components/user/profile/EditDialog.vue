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
      <div class="text-xs text-foreground-2 mt-2 flex gap-1 items-center">
        User ID:
        <CommonTextLink size="small" no-underline @click="copyUserId">
          #{{ user.id }}
        </CommonTextLink>
        <template v-if="distinctId">
          |
          <CommonTextLink size="small" no-underline @click="copyDistinctId">
            {{ distinctId }}
          </CommonTextLink>
        </template>
      </div>
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CodeBracketIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useActiveUser } from '~/lib/auth/composables/activeUser'
import type { FormButtonStyle } from '@speckle/ui-components/dist/helpers/form/button'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { activeUser: user, distinctId } = useActiveUser()
const { copy } = useClipboard()

const isOpen = computed({
  get: () => !!(props.open && user.value),
  set: (newVal) => emit('update:open', newVal)
})

const developerSettingsButton = computed(() => ({
  text: 'Manage',
  color: 'default' as FormButtonStyle,
  to: '/developer-settings/',
  iconRight: ChevronRightIcon,
  onClick: () => {
    isOpen.value = false
  }
}))

const copyUserId = () => {
  if (!user.value) return
  copy(user.value.id)
}

const copyDistinctId = () => {
  if (!distinctId.value) return
  copy(distinctId.value)
}
</script>

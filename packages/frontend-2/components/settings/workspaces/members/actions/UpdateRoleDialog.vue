<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 text-body-2xs !p-2">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.name }}
        </div>
      </CommonCard>

      <p>{{ mainMessage }}</p>

      <p class="text-foreground-2 text-body-2xs">
        {{ roleInfo }}. Learn more about
        <NuxtLink
          :to="LearnMoreRolesSeatsUrl"
          target="_blank"
          class="text-foreground-2 underline"
        >
          workspace roles.
        </NuxtLink>
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import type { UserItem } from '~/components/settings/workspaces/members/new/MembersTable.vue'
import { LearnMoreRolesSeatsUrl } from '~/lib/common/helpers/route'
import { Roles } from '@speckle/shared'
import { WorkspaceRoleDescriptions } from '~/lib/settings/helpers/constants'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type {
  SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment,
  SettingsWorkspacesNewMembersTable_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  user: UserItem
  newRole: MaybeNullOrUndefined<string>
  workspace?: MaybeNullOrUndefined<
    | SettingsWorkspacesNewMembersTable_WorkspaceFragment
    | SettingsWorkspacesMembersNewGuestsTable_WorkspaceFragment
  >
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserRole = useWorkspaceUpdateRole()

const isGuest = computed(() => {
  return props.user.role === Roles.Workspace.Guest
})

const title = computed(() => {
  if (!props.newRole) return ''
  if (props.newRole === Roles.Workspace.Admin) return 'Make an admin?'
  if (props.newRole === Roles.Workspace.Member)
    return isGuest.value ? 'Make a member?' : 'Remove admin?'
  return 'Make a guest?'
})

const buttonText = computed(() => {
  if (!props.newRole) return ''
  if (props.newRole === Roles.Workspace.Admin) return 'Make an admin'
  if (props.newRole === Roles.Workspace.Member)
    return isGuest.value ? 'Make a member' : 'Remove admin'
  return 'Make a guest'
})

const mainMessage = computed(() => {
  if (!props.newRole) return ''
  if (props.newRole === Roles.Workspace.Admin) {
    return 'They will be able to edit workspaces, including settings, members and all projects.'
  }
  if (props.newRole === Roles.Workspace.Member) {
    return isGuest.value
      ? 'They will be able to access all projects.'
      : 'They will be able to create and own projects, but will no longer have admin privileges.'
  }
  return 'They will lose access to all projects. Make sure to add them back to the specific projects they need access to.'
})

const roleInfo = computed(() => {
  if (!props.newRole) return ''
  return WorkspaceRoleDescriptions[
    props.newRole as keyof typeof WorkspaceRoleDescriptions
  ]
})

const handleConfirm = async () => {
  if (!props.workspace?.id || !props.newRole) return

  await updateUserRole({
    userId: props.user.id,
    role: props.newRole as string,
    workspaceId: props.workspace.id
  })

  open.value = false
  emit('success')
}

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: buttonText.value,
    props: {
      color: 'primary'
    },
    onClick: handleConfirm
  }
])
</script>

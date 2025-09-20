<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>{{ title }}</template>
    <CommonAlert
      v-if="props.user.user.workspaceDomainPolicyCompliant === false"
      color="danger"
      hide-icon
      size="xs"
      class="mb-4"
    >
      <template #title>User is not domain compliant</template>
      <template #description>
        <span class="text-body-2xs">
          This user is not using a compliant email domain and cannot become a workspace
          member.
        </span>
      </template>
    </CommonAlert>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <CommonCard class="bg-foundation-2 text-body-2xs !p-2">
        <div class="flex flex-row gap-x-2 items-center">
          <UserAvatar
            hide-tooltip
            :user="user.user"
            light-style
            class="bg-foundation"
            no-bg
          />
          {{ user.user.name }}
        </div>
      </CommonCard>

      <p v-if="mainMessage" class="text-body-sm">
        {{ mainMessage }}
      </p>

      <p v-if="roleInfo" class="text-foreground-2 text-body-2xs">
        {{ roleInfo }}
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { Roles } from '@speckle/shared'
import { WorkspaceRoleDescriptions } from '~/lib/settings/helpers/constants'
import { useWorkspaceUpdateRole } from '~/lib/workspaces/composables/management'
import type {
  SettingsWorkspacesMembersActionsMenu_UserFragment,
  SettingsWorkspacesMembersTableHeader_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  user: SettingsWorkspacesMembersActionsMenu_UserFragment
  newRole: MaybeNullOrUndefined<string>
  workspace?: MaybeNullOrUndefined<SettingsWorkspacesMembersTableHeader_WorkspaceFragment>
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const open = defineModel<boolean>('open', { required: true })

const updateUserRole = useWorkspaceUpdateRole()

const isLoading = ref(false)

const title = computed(() => {
  if (!props.newRole) return ''
  if (props.newRole === Roles.Workspace.Member) return 'Make a member?'
  return 'Make a guest?'
})

const buttonText = computed(() => {
  if (!props.newRole) return ''
  if (props.newRole === Roles.Workspace.Member) return 'Make a member'
  return 'Make a guest'
})

const mainMessage = computed(() => {
  if (!props.newRole) return undefined
  if (props.user.user.workspaceDomainPolicyCompliant === false) return undefined
  if (props.newRole === Roles.Workspace.Member) {
    return 'They will be able to access all projects.'
  }
  return 'They will lose access to all projects. Make sure to add them back to the specific projects they need access to.'
})

const roleInfo = computed(() => {
  if (!props.newRole) return undefined
  if (props.user.user.workspaceDomainPolicyCompliant === false) return undefined
  return WorkspaceRoleDescriptions[
    props.newRole as keyof typeof WorkspaceRoleDescriptions
  ]
})

const handleConfirm = async () => {
  if (!props.workspace?.id || !props.newRole) return

  isLoading.value = true
  try {
    await updateUserRole({
      userId: props.user.id,
      role: props.newRole as string,
      workspaceId: props.workspace.id,
      previousRole: props.user.role
    })

    open.value = false
    emit('success')
  } finally {
    isLoading.value = false
  }
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
      color: 'primary',
      loading: isLoading.value
    },
    onClick: handleConfirm,
    disabled: props.user.user.workspaceDomainPolicyCompliant === false
  }
])
</script>

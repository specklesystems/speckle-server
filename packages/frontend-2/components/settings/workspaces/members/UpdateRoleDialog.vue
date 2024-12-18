<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Change role</template>
    <div class="flex flex-col gap-4 mb-4 -mt-1">
      <FormSelectWorkspaceRoles
        v-model="newRole"
        label="New role"
        fully-control-value
        :disabled-items="disabledItems"
        :current-role="currentRole"
        show-label
        show-description
      />
      <div
        v-if="
          workspaceDomainPolicyCompliant === false && newRole !== Roles.Workspace.Guest
        "
        class="flex gap-x-2 items-center"
      >
        <ExclamationCircleIcon class="text-danger w-4 h-4" />
        <p class="text-foreground">
          This user can only have the guest role due to the workspace policy.
        </p>
      </div>
      <CommonCard
        v-if="newRole"
        class="bg-foundation !py-3 text-body-2xs flex flex-row gap-y-2"
      >
        <ul class="pl-2">
          <li
            v-for="(message, i) in getWorkspaceProjectRoleMessages(newRole)"
            :key="`message-${i}`"
            class="py-1 list-disc"
          >
            {{ message }}
          </li>
        </ul>
      </CommonCard>
      <p v-if="newRole && showBillingInfo" class="text-body-2xs text-foreground-2">
        Your workspace is currently billed for {{ memberSeatText
        }}{{ hasGuestSeats ? ` and ${guestSeatText}` : '' }}. Changing a user's role may
        add a seat to your current billing cycle. Released seats will be adjusted at the
        start of your next billing cycle:
        {{ nextBillingCycleEnd }}
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { type MaybeNullOrUndefined, Roles, type WorkspaceRoles } from '@speckle/shared'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import {
  type SettingsWorkspacesMembersChangeRoleDialog_WorkspaceFragment,
  type WorkspacePlans,
  WorkspacePlanStatuses
} from '~/lib/common/generated/gql/graphql'
import dayjs from 'dayjs'
import { isPaidPlan } from '~/lib/billing/helpers/types'

graphql(`
  fragment SettingsWorkspacesMembersChangeRoleDialog_Workspace on Workspace {
    id
    plan {
      status
      name
    }
    subscription {
      currentBillingCycleEnd
      seats {
        guest
        plan
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'updateRole', newRole: WorkspaceRoles): void
}>()

const props = defineProps<{
  workspaceDomainPolicyCompliant?: boolean | null
  currentRole?: WorkspaceRoles
  workspace: MaybeNullOrUndefined<SettingsWorkspacesMembersChangeRoleDialog_WorkspaceFragment>
}>()

const open = defineModel<boolean>('open', { required: true })
const newRole = ref<WorkspaceRoles | undefined>()

const disabledItems = computed<WorkspaceRoles[]>(() =>
  props.workspaceDomainPolicyCompliant === false
    ? [Roles.Workspace.Member, Roles.Workspace.Admin]
    : []
)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Update',
    props: { color: 'primary', disabled: !newRole.value },
    onClick: () => {
      open.value = false
      if (newRole.value) {
        emit('updateRole', newRole.value)
      }
    }
  }
])

const memberSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.plan} member ${
    props.workspace.subscription.seats.plan === 1 ? 'seat' : 'seats'
  }`
})
const guestSeatText = computed(() => {
  if (!props.workspace?.subscription) return ''
  return `${props.workspace.subscription.seats.guest} guest ${
    props.workspace.subscription.seats.guest === 1 ? 'seat' : 'seats'
  }`
})
const hasGuestSeats = computed(() => {
  return (
    props.workspace?.subscription?.seats.guest &&
    props.workspace.subscription.seats.guest > 0
  )
})
const nextBillingCycleEnd = computed(() => {
  if (!props.workspace?.subscription) return ''
  return dayjs(props.workspace.subscription.currentBillingCycleEnd).format(
    'MMMM D, YYYY'
  )
})
const showBillingInfo = computed(() => {
  if (!props.workspace?.plan) return false
  return (
    isPaidPlan(props.workspace.plan.name as unknown as WorkspacePlans) &&
    props.workspace.plan.status === WorkspacePlanStatuses.Valid
  )
})
const getWorkspaceProjectRoleMessages = (workspaceRole: WorkspaceRoles): string[] => {
  switch (workspaceRole) {
    case Roles.Workspace.Admin:
      return [
        'Becomes project owner for all existing and new workspace projects.',
        'Cannot be removed or have role changed by project owners.'
      ]

    case Roles.Workspace.Member:
      return [
        'Becomes project viewer for all existing and new workspace projects.',
        'Project owners can change their role or remove them.'
      ]

    case Roles.Workspace.Guest:
      return [
        'Loses access to all existing workspace projects.',
        'Project owners can assign a role or remove them.'
      ]
  }
}

watch(
  () => open.value,
  () => {
    newRole.value = undefined
  }
)
</script>

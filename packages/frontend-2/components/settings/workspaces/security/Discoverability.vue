<template>
  <section class="py-8">
    <SettingsSectionHeader title="Discoverable workspace" subheading />
    <p class="text-body-xs text-foreground-2 mt-2 mb-6">
      Make the workspace discoverable to coworkers for easy joining.
    </p>

    <div class="flex flex-col space-y-6">
      <div class="flex items-center">
        <div class="flex-1 flex-col pr-6 gap-y-1">
          <p class="text-body-xs font-medium text-foreground">
            Enable workspace discoverability
          </p>
          <p class="text-body-2xs text-foreground-2 leading-5 max-w-md mt-1">
            Users can discover the workspace if they sign up with a verified email
            domain.
          </p>
        </div>
        <div
          v-tippy="
            !isWorkspaceAdmin
              ? 'You must be a workspace admin'
              : !hasWorkspaceDomains
              ? 'Your workspace must have at least one verified domain'
              : undefined
          "
        >
          <FormSwitch
            v-model="isDomainDiscoverabilityEnabled"
            name="domain-discoverability"
            :disabled="!hasWorkspaceDomains || !isWorkspaceAdmin"
            :show-label="false"
          />
        </div>
      </div>

      <div v-if="isDomainDiscoverabilityEnabled" class="flex flex-col gap-2">
        <p class="text-body-xs font-medium text-foreground">
          When someone wants to join
        </p>
        <div
          v-tippy="!isWorkspaceAdmin ? 'You must be a workspace admin' : undefined"
          class="max-w-max"
        >
          <FormRadio
            v-for="option in radioOptions"
            :key="option.value"
            :disabled="!isWorkspaceAdmin"
            :label="option.title"
            :value="option.value"
            name="joinPolicy"
            :checked="joinPolicy === option.value"
            size="sm"
            label-classes="!font-normal"
            @change="handleRadioChange(option.value)"
          />
        </div>
      </div>
    </div>

    <SettingsConfirmDialog
      v-model:open="showConfirmJoinPolicyDialog"
      title="Confirm change"
      @confirm="handleJoinPolicyConfirm"
      @cancel="handleJoinPolicyCancel"
    >
      <p class="text-body-xs text-foreground mb-2">
        This will allow users with verified domain emails to join automatically without
        admin approval.
        <span
          v-if="
            workspace.defaultSeatType === SeatTypes.Editor &&
            isSelfServePlan &&
            isPaidPlan
          "
        >
          They will join on a paid Editor seat.
        </span>
      </p>
      <p class="text-body-xs text-foreground">Are you sure you want to enable this?</p>
    </SettingsConfirmDialog>
  </section>
</template>

<script setup lang="ts">
import { Roles, SeatTypes } from '@speckle/shared'
import { useMutation } from '@vue/apollo-composable'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesSecurityDiscoverability_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import {
  workspaceUpdateDiscoverabilityMutation,
  workspaceUpdateAutoJoinMutation
} from '~/lib/workspaces/graphql/mutations'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

enum JoinPolicy {
  AdminApproval = 'admin-approval',
  AutoJoin = 'auto-join'
}

graphql(`
  fragment SettingsWorkspacesSecurityDiscoverability_Workspace on Workspace {
    id
    slug
    role
    domains {
      id
      domain
    }
    discoverabilityEnabled
    discoverabilityAutoJoinEnabled
    defaultSeatType
  }
`)

const props = defineProps<{
  workspace: SettingsWorkspacesSecurityDiscoverability_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateDiscoverability } = useMutation(
  workspaceUpdateDiscoverabilityMutation
)
const { mutate: updateAutoJoin } = useMutation(workspaceUpdateAutoJoinMutation)
const { triggerNotification } = useGlobalToast()
const { isSelfServePlan, isPaidPlan } = useWorkspacePlan(props.workspace.slug)

const showConfirmJoinPolicyDialog = ref(false)
const pendingIsAutoJoinEnabled = ref(false)
const currentJoinPolicy = ref<JoinPolicy>()

const workspaceDomains = computed(() => {
  return props.workspace?.domains || []
})

const isWorkspaceAdmin = computed(() => props.workspace.role === Roles.Workspace.Admin)

const hasWorkspaceDomains = computed(() => workspaceDomains.value.length > 0)

const isDomainDiscoverabilityEnabled = computed({
  get: () => props.workspace?.discoverabilityEnabled || false,
  set: async (newVal) => {
    if (!props.workspace?.id) return

    const result = await updateDiscoverability({
      input: {
        id: props.workspace.id,
        discoverabilityEnabled: newVal
      }
    }).catch(convertThrowIntoFetchResult)

    if (result?.data) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'Workspace discoverability updated',
        description: `Workspace discoverability has been ${
          newVal ? 'enabled' : 'disabled'
        }`
      })
      mixpanel.track('Workspace Discoverability Toggled', {
        value: newVal,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace?.id
      })

      // If turning off discoverability, also turn off auto-join
      if (!newVal && props.workspace.discoverabilityAutoJoinEnabled) {
        const autoJoinResult = await updateAutoJoin({
          input: {
            id: props.workspace.id,
            discoverabilityAutoJoinEnabled: false
          }
        }).catch(convertThrowIntoFetchResult)

        if (autoJoinResult?.data) {
          mixpanel.track('Workspace Join Policy Updated', {
            value: 'admin-approval',
            // eslint-disable-next-line camelcase
            workspace_id: props.workspace.id
          })
        }
      }
    }
  }
})

const joinPolicy = computed({
  get: () => {
    // Use currentJoinPolicy if it's been set, otherwise use workspace state
    if (currentJoinPolicy.value !== undefined) {
      return currentJoinPolicy.value
    }
    return props.workspace?.discoverabilityAutoJoinEnabled
      ? JoinPolicy.AutoJoin
      : JoinPolicy.AdminApproval
  },
  set: (newVal) => {
    handleJoinPolicyUpdate(newVal)
  }
})

const radioOptions = shallowRef([
  {
    title: 'A workspace admin has to accept a join request',
    value: JoinPolicy.AdminApproval
  },
  {
    title: 'Users can join immediately without admin approval',
    value: JoinPolicy.AutoJoin
  }
] as const)

const handleJoinPolicyUpdate = async (newValue: JoinPolicy, confirmed = false) => {
  if (!props.workspace?.id) return

  // If enabling auto-join and not yet confirmed, show confirmation dialog
  if (newValue === JoinPolicy.AutoJoin && !confirmed) {
    showConfirmJoinPolicyDialog.value = true
    pendingIsAutoJoinEnabled.value = true
    return
  }

  const result = await updateAutoJoin({
    input: {
      id: props.workspace.id,
      discoverabilityAutoJoinEnabled: newValue === JoinPolicy.AutoJoin
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    // Update our local state to match the successful change
    currentJoinPolicy.value = newValue

    // Reset dialog state if it was open
    if (showConfirmJoinPolicyDialog.value) {
      showConfirmJoinPolicyDialog.value = false
      pendingIsAutoJoinEnabled.value = false
    }

    const notificationConfig =
      newValue === JoinPolicy.AutoJoin
        ? {
            title: 'Join without admin approval enabled',
            description:
              'Users with a verified domain can now join without admin approval'
          }
        : {
            title: 'Admin approval enabled',
            description: 'Admin approval is now required for new users to join'
          }

    triggerNotification({
      type: ToastNotificationType.Success,
      ...notificationConfig
    })

    mixpanel.track('Workspace Join Policy Updated', {
      value: newValue === JoinPolicy.AutoJoin ? 'auto-join' : 'admin-approval',
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
  }
}

const handleJoinPolicyConfirm = async () => {
  if (!pendingIsAutoJoinEnabled.value) return
  await handleJoinPolicyUpdate(JoinPolicy.AutoJoin, true)
}

const handleJoinPolicyCancel = () => {
  // Revert the radio selection back to the current actual state
  currentJoinPolicy.value = props.workspace?.discoverabilityAutoJoinEnabled
    ? JoinPolicy.AutoJoin
    : JoinPolicy.AdminApproval

  // Close dialog and reset pending state
  showConfirmJoinPolicyDialog.value = false
  pendingIsAutoJoinEnabled.value = false
}

const handleRadioChange = (newValue: JoinPolicy) => {
  // Immediately update our local state to show the selection
  currentJoinPolicy.value = newValue
  // Then handle the policy update (which may show confirmation dialog)
  handleJoinPolicyUpdate(newValue)
}

watch(
  () => workspaceDomains.value.length,
  async (newLength) => {
    // If last domain was removed, disable discoverability features
    if (newLength === 0 && props.workspace?.id) {
      if (props.workspace.discoverabilityEnabled) {
        isDomainDiscoverabilityEnabled.value = false
      }
    }
  }
)
</script>

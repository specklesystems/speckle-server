<template>
  <section class="flex flex-col space-y-3">
    <div class="flex flex-col sm:flex-row gap-y-3 sm:items-center">
      <div class="flex-1 flex-col pr-6 gap-y-1">
        <p class="text-body-xs font-medium text-foreground">
          Default seat for new members
        </p>
        <p class="text-body-2xs text-foreground-2 leading-5 max-w-[250px]">
          Set the default seat type assigned to new workspace members.
        </p>
      </div>
      <FormSelectBase
        v-model="seatTypeModel"
        v-tippy="!isWorkspaceAdmin ? 'You must be a workspace admin' : undefined"
        :items="defaultSeatTypeOptions"
        :disabled="!isWorkspaceAdmin"
        name="defaultSeatType"
        label="Default seat type"
        class="min-w-[240px]"
        :allow-unset="false"
        :show-label="false"
        fully-control-value
      >
        <template #nothing-selected>Select default</template>
        <template #something-selected="{ value }">
          <div class="text-foreground font-medium capitalize">
            {{ Array.isArray(value) ? value[0] : value }}
          </div>
        </template>
        <template #option="{ item }">
          <div class="flex flex-col space-y-0.5">
            <span class="capitalize">{{ item }}</span>
            <span class="text-body-3xs text-foreground-2">
              {{ WorkspaceSeatTypeDescription[Roles.Workspace.Member][item] }}
            </span>
          </div>
        </template>
      </FormSelectBase>
    </div>

    <SettingsConfirmDialog
      v-model:open="showConfirmSeatTypeDialog"
      title="Confirm change"
      @confirm="handleSeatTypeConfirm"
      @cancel="handleSeatTypeCancel"
    >
      <p class="text-body-xs text-foreground mb-2">
        You have
        <span class="font-medium">Join without admin approval</span>
        enabled.
      </p>
      <p class="text-body-xs text-foreground mb-2">
        Setting the default seat type to
        <span class="font-medium">Editor</span>
        means each user who joins will consume a paid seat and possibly incur charges.
      </p>
      <p class="text-body-xs text-foreground">Are you sure you want to enable this?</p>
    </SettingsConfirmDialog>
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import type {
  WorkspaceSeatType,
  SettingsWorkspacesSecurity_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { Roles, SeatTypes } from '@speckle/shared'
import { workspaceUpdateDefaultSeatTypeMutation } from '~/lib/workspaces/graphql/mutations'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { WorkspaceSeatTypeDescription } from '~/lib/settings/helpers/constants'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~/lib/common/helpers/graphql'

const props = defineProps<{
  workspace: SettingsWorkspacesSecurity_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateDefaultSeatType } = useMutation(
  workspaceUpdateDefaultSeatTypeMutation
)
const { triggerNotification } = useGlobalToast()
const { isSelfServePlan } = useWorkspacePlan(props.workspace.slug)

const currentSeatType = ref<WorkspaceSeatType>(props.workspace.defaultSeatType)

const showConfirmSeatTypeDialog = ref(false)
const pendingNewSeatType = ref<WorkspaceSeatType>()

const isWorkspaceAdmin = computed(() => {
  return props.workspace.role === Roles.Workspace.Admin
})

const seatTypeModel = computed({
  get: () => currentSeatType.value,
  set: (newValue: WorkspaceSeatType) => {
    handleSeatTypeChange(newValue)
  }
})

const handleSeatTypeChange = (newValue: WorkspaceSeatType) => {
  if (newValue === currentSeatType.value) return

  // If setting to Editor with auto-join enabled on paid plan, show confirmation
  if (
    newValue === SeatTypes.Editor &&
    props.workspace.discoverabilityAutoJoinEnabled &&
    isSelfServePlan
  ) {
    pendingNewSeatType.value = newValue
    showConfirmSeatTypeDialog.value = true
    return
  }
  // Otherwise, apply the change directly
  applySeatTypeChange(newValue)
}

const applySeatTypeChange = async (seatTypeValue: WorkspaceSeatType) => {
  const result = await updateDefaultSeatType({
    input: {
      id: props.workspace.id,
      defaultSeatType: seatTypeValue
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    currentSeatType.value = seatTypeValue

    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Default seat type updated',
      description: `New members will now be assigned ${
        seatTypeValue.charAt(0).toUpperCase() + seatTypeValue.slice(1)
      } seats by default`
    })

    mixpanel.track('Workspace Default Seat Type Updated', {
      value: seatTypeValue,
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
  } else {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update default seat type',
      description: getFirstErrorMessage(result?.errors)
    })
  }
}

const handleSeatTypeConfirm = async () => {
  if (!pendingNewSeatType.value) return
  await applySeatTypeChange(pendingNewSeatType.value)
  pendingNewSeatType.value = undefined
}

const handleSeatTypeCancel = () => {
  pendingNewSeatType.value = undefined
  showConfirmSeatTypeDialog.value = false
}

const defaultSeatTypeOptions: WorkspaceSeatType[] = Object.values(SeatTypes)

watch(
  () => props.workspace.defaultSeatType,
  (newVal) => {
    if (newVal) {
      currentSeatType.value = newVal
    }
  }
)
</script>

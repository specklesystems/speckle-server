<template>
  <section class="flex flex-col space-y-3">
    <div class="flex items-center">
      <div class="flex-1 flex-col pr-6 gap-y-1">
        <p class="text-body-xs font-medium text-foreground">
          Default seat for new members
        </p>
        <p class="text-body-2xs text-foreground-2 leading-5 max-w-sm">
          Set the default seat type assigned to new workspace members.
        </p>
      </div>
      <FormSelectBase
        v-model="internalDefaultSeatType"
        :items="defaultSeatTypeOptions"
        name="defaultSeatType"
        label="Default seat type"
        class="min-w-[140px]"
        :allow-unset="false"
        :show-label="false"
        fully-control-value
        @update:model-value="onChange"
      >
        <template #nothing-selected>Select default</template>
        <template #something-selected="{ value }">
          <div class="truncate text-foreground capitalize">
            {{ Array.isArray(value) ? value[0] : value }}
          </div>
        </template>
        <template #option="{ item }">
          <div class="flex flex-col space-y-0.5">
            <span class="truncate capitalize">{{ item }}</span>
          </div>
        </template>
      </FormSelectBase>
    </div>

    <SettingsConfirmDialog
      :open="showConfirmSeatTypeDialog"
      title="Confirm seat type change"
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
        means each user who joins will consume a paid seat and incur charges.
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
import { SeatTypes } from '@speckle/shared'
import { workspaceUpdateDefaultSeatTypeMutation } from '~/lib/workspaces/graphql/mutations'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'

const props = defineProps<{
  workspace: SettingsWorkspacesSecurity_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateDefaultSeatType } = useMutation(
  workspaceUpdateDefaultSeatTypeMutation
)
const { triggerNotification } = useGlobalToast()
const { isPaidPlan } = useWorkspacePlan(props.workspace.slug)

const internalDefaultSeatType = ref<WorkspaceSeatType>(props.workspace.defaultSeatType)

const showConfirmSeatTypeDialog = ref(false)
const pendingSeatType = ref<WorkspaceSeatType>()

const onChange = (newVal: WorkspaceSeatType | WorkspaceSeatType[] | undefined) => {
  if (!newVal) return

  const seatTypeValue = Array.isArray(newVal) ? newVal[0] : newVal
  if (!seatTypeValue) return

  const currentSeatType = props.workspace.defaultSeatType
  if (seatTypeValue === currentSeatType) return

  // If setting to Editor with auto-join enabled on paid plan, show confirmation
  if (
    seatTypeValue === SeatTypes.Editor &&
    props.workspace.discoverabilityAutoJoinEnabled &&
    isPaidPlan.value
  ) {
    showConfirmSeatTypeDialog.value = true
    pendingSeatType.value = seatTypeValue
    internalDefaultSeatType.value = props.workspace.defaultSeatType
    return
  }

  applySeatTypeChange(seatTypeValue)
}

const applySeatTypeChange = async (seatTypeValue: WorkspaceSeatType) => {
  const result = await updateDefaultSeatType({
    input: {
      id: props.workspace.id,
      defaultSeatType: seatTypeValue
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    internalDefaultSeatType.value = seatTypeValue

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
  }
}

const handleSeatTypeConfirm = async () => {
  if (!pendingSeatType.value) return
  await applySeatTypeChange(pendingSeatType.value)
  pendingSeatType.value = undefined
}

const handleSeatTypeCancel = () => {
  pendingSeatType.value = undefined
  internalDefaultSeatType.value = props.workspace.defaultSeatType
}

const defaultSeatTypeOptions: WorkspaceSeatType[] = Object.values(SeatTypes)

watch(
  () => props.workspace.defaultSeatType,
  (newVal) => {
    internalDefaultSeatType.value = newVal
  }
)
</script>

<template>
  <section class="flex flex-col space-y-3">
    <div class="flex items-center">
      <div class="flex-1 flex-col pr-6 gap-y-1">
        <p class="text-body-xs font-medium text-foreground">
          Default seat for new members
        </p>
        <p class="text-body-2xs text-foreground-2 leading-5 max-w-md">
          Set the default seat type assigned to new workspace members through invites,
          auto-join, and join requests.
        </p>
      </div>
      <FormSelectBase
        v-model="internalDefaultSeatType"
        :items="defaultSeatTypeOptions"
        name="defaultSeatType"
        label="Default seat type"
        class="min-w-[140px]"
        :show-label="false"
        @update:model-value="onChange"
      >
        <template #nothing-selected>Select default</template>
        <template #something-selected="{ value }">
          <div class="truncate text-foreground capitalize">
            {{ getSeatTypeLabel(Array.isArray(value) ? value[0] : value) }}
          </div>
        </template>
        <template #option="{ item }">
          <div class="flex flex-col space-y-0.5">
            <span class="truncate capitalize">{{ getSeatTypeLabel(item) }}</span>
          </div>
        </template>
      </FormSelectBase>
    </div>
    <!-- Warning for editor + auto-join combination -->
    <CommonCard
      v-if="showEditorAutoJoinWarning"
      class="bg-warning-lighter border-warning"
    >
      <div class="flex items-start space-x-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-body-xs font-medium text-warning-darker">
            Editor seats will be charged automatically
          </p>
          <p class="text-body-2xs text-warning-darker mt-1">
            With auto-join enabled and default seat set to Editor, each user who joins
            will consume a paid seat and incur charges.
          </p>
        </div>
      </div>
    </CommonCard>
  </section>
</template>

<script setup lang="ts">
import { useMutation } from '@vue/apollo-composable'
import type {
  WorkspaceSeatType,
  WorkspacePlans,
  SettingsWorkspacesSecurity_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import { isPaidPlan } from '@speckle/shared'
import { workspaceUpdateDefaultSeatTypeMutation } from '~/lib/workspaces/graphql/mutations'
import { useMixpanel } from '~/lib/core/composables/mp'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  workspace: SettingsWorkspacesSecurity_WorkspaceFragment
}>()

const mixpanel = useMixpanel()
const { mutate: updateDefaultSeatType } = useMutation(
  workspaceUpdateDefaultSeatTypeMutation
)
const { triggerNotification } = useGlobalToast()

const internalDefaultSeatType = ref<WorkspaceSeatType>(props.workspace.defaultSeatType)

const isStripeLinkedPlan = computed(() => {
  const planName = props.workspace?.plan?.name
  return planName ? isPaidPlan(planName as WorkspacePlans) : false
})

const onChange = async (
  newVal: WorkspaceSeatType | WorkspaceSeatType[] | undefined
) => {
  if (!props.workspace?.id || !newVal) return

  const seatTypeValue = Array.isArray(newVal) ? newVal[0] : newVal
  if (!seatTypeValue) return

  const result = await updateDefaultSeatType({
    input: {
      id: props.workspace.id,
      defaultSeatType: seatTypeValue
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Default seat type updated',
      description: `New members will now be assigned ${getSeatTypeLabel(
        seatTypeValue
      )} seats by default`
    })

    mixpanel.track('Workspace Default Seat Type Updated', {
      value: seatTypeValue,
      // eslint-disable-next-line camelcase
      workspace_id: props.workspace.id
    })
  }
}

const showEditorAutoJoinWarning = computed(() => {
  return (
    internalDefaultSeatType.value === 'editor' &&
    props.workspace.discoverabilityAutoJoinEnabled &&
    isStripeLinkedPlan.value
  )
})

const defaultSeatTypeOptions: WorkspaceSeatType[] = ['viewer', 'editor']

const getSeatTypeLabel = (seatType: WorkspaceSeatType): string => {
  return seatType.charAt(0).toUpperCase() + seatType.slice(1)
}
</script>

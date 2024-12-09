<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Upgrade workspace"
    :buttons="dialogButtons"
    max-width="md"
  >
    <div class="text-body-xs text-foreground">
      <p>You are about to upgrade your workspace to the following plan:</p>
      <CommonCard class="bg-foundation !p-3 my-2">
        <p class="font-medium">Workspace {{ startCase(plan) }} plan</p>
        <p>
          £{{ seatPrice }}/seat/month, billed
          {{ billingInterval === BillingInterval.Yearly ? 'annually' : 'monthly' }}
        </p>
      </CommonCard>
      <p>Do you want to proceed?</p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import {
  type WorkspacePlans,
  BillingInterval,
  type PaidWorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { startCase } from 'lodash'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import { Roles } from '@speckle/shared'
import { isPaidPlan } from '~/lib/billing/helpers/types'

const props = defineProps<{
  plan: WorkspacePlans
  billingInterval: BillingInterval
  workspaceId: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const { upgradePlan } = useBillingActions()

const seatPrice = computed(() => {
  if (isPaidPlan(props.plan)) {
    const planConfig =
      pricingPlansConfig.plans[props.plan as unknown as PaidWorkspacePlans]
    return planConfig.cost[props.billingInterval][Roles.Workspace.Member]
  }

  return 0
})
const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Upgrade',
    props: {
      color: 'primary'
    },
    onClick: () => onSubmit()
  }
])

const onSubmit = () => {
  upgradePlan({
    plan: props.plan as unknown as PaidWorkspacePlans,
    cycle: props.billingInterval,
    workspaceId: props.workspaceId
  })

  isOpen.value = false
}
</script>

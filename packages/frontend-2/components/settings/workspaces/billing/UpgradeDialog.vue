<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Upgrade workspace"
    :buttons="dialogButtons"
    max-width="md"
  >
    <div class="text-body-xs text-foreground">
      <p>You are about to upgrade your workspace to the following plan:</p>
      <CommonCard class="font-medium bg-foundation !p-3 my-2">
        Workspace {{ startCase(plan) }} plan,
        {{ billingInterval === BillingInterval.Yearly ? 'annual' : 'monthly' }}
      </CommonCard>
      <p>Do you want to proceed?</p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import {
  type PaidWorkspacePlans,
  type WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { startCase } from 'lodash'

const props = defineProps<{
  plan: WorkspacePlans
  billingInterval: BillingInterval
  workspaceId: string
}>()
const isOpen = defineModel<boolean>('open', { required: true })

const { upgradePlan } = useBillingActions()

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

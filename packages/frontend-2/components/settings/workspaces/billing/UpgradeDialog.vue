<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Upgrade workspace"
    :buttons="dialogButtons"
    max-width="md"
  >
    <p class="text-body-xs text-foreground">
      You are about to upgrade your workspace to the
      <span class="font-medium">
        {{ billingInterval === BillingInterval.Yearly ? 'anual' : 'monthly' }}
        {{ plan }}
      </span>
      plan.
      <br />
      Do you want to proceed?
    </p>
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

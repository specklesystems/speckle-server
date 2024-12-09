<template>
  <WorkspaceWizardStep title="Choose a plan">
    <div class="flex flex-col max-w-5xl w-full items-center">
      <div class="grid lg:grid-cols-3 gap-y-2 gap-x-2 w-full">
        <SettingsWorkspacesBillingPricingTablePlan
          v-for="plan in plans"
          :key="plan.name"
          :plan="plan"
          :yearly-interval-selected="isYearlySelected"
          :badge-text="
            plan.name === WorkspacePlans.Starter && !isYearlySelected
              ? '30-day free trial'
              : undefined
          "
          @on-yearly-interval-selected="onYearlyIntervalSelected"
        >
          <template #cta>
            <FormButton
              :color="plan.name === WorkspacePlans.Starter ? 'primary' : 'outline'"
              full-width
              @click="onCtaClick(plan.name)"
            >
              {{
                plan.name === WorkspacePlans.Starter && !isYearlySelected
                  ? 'Start 30-day free trial'
                  : `Subscribe to ${startCase(plan.name)}`
              }}
            </FormButton>
          </template>
        </SettingsWorkspacesBillingPricingTablePlan>
      </div>
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </div>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import {
  type PaidWorkspacePlans,
  BillingInterval,
  WorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import {
  useWorkspacesWizard,
  useWorkspaceWizardState
} from '~/lib/workspaces/composables/wizard'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import { useMixpanel } from '~/lib/core/composables/mp'
import { startCase } from 'lodash'

const { goToNextStep, goToPreviousStep } = useWorkspacesWizard()
const wizardState = useWorkspaceWizardState()
const mixpanel = useMixpanel()

const plans = ref(pricingPlansConfig.plans)
const isYearlySelected = ref(false)

const onCtaClick = (plan: WorkspacePlans) => {
  wizardState.value.state.plan = plan as unknown as PaidWorkspacePlans
  wizardState.value.state.billingInterval = isYearlySelected.value
    ? BillingInterval.Yearly
    : BillingInterval.Monthly

  mixpanel.track('Workspace Pricing Step Completed', {
    plan: wizardState.value.state.plan,
    billingInterval: wizardState.value.state.billingInterval
  })

  goToNextStep()
}

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

watch(
  () => wizardState.value.state.billingInterval,
  () => {
    isYearlySelected.value =
      wizardState.value.state.billingInterval === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>

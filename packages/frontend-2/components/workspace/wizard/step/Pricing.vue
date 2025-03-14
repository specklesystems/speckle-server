<template>
  <WorkspaceWizardStep title="Choose a plan">
    <div class="flex flex-col max-w-5xl w-full items-center">
      <div class="grid lg:grid-cols-3 gap-y-2 gap-x-2 w-full">
        <SettingsWorkspacesBillingPricingTablePlan
          v-for="plan in oldPlans"
          :key="plan"
          :plan="plan"
          :yearly-interval-selected="isYearlySelected"
          :badge-text="
            plan === WorkspacePlans.Starter && !isYearlySelected
              ? '30-day free trial'
              : undefined
          "
          @on-yearly-interval-selected="onYearlyIntervalSelected"
        >
          <template #cta>
            <FormButton
              :color="plan === WorkspacePlans.Starter ? 'primary' : 'outline'"
              full-width
              @click="onCtaClick(plan)"
            >
              {{
                plan === WorkspacePlans.Starter && !isYearlySelected
                  ? 'Start 30-day free trial'
                  : `Subscribe to ${startCase(plan)}`
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
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'
import { startCase } from 'lodash'
import { PaidWorkspacePlansOld } from '@speckle/shared'

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()

const isYearlySelected = ref(false)

const oldPlans = computed(() => Object.values(PaidWorkspacePlansOld))

const onCtaClick = (plan: WorkspacePlans) => {
  state.value.plan = plan as unknown as PaidWorkspacePlans
  state.value.billingInterval = isYearlySelected.value
    ? BillingInterval.Yearly
    : BillingInterval.Monthly

  mixpanel.track('Workspace Pricing Step Completed', {
    plan: state.value.plan,
    billingInterval: state.value.billingInterval
  })

  goToNextStep()
}

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlySelected.value = newValue
}

watch(
  () => state.value.billingInterval,
  () => {
    isYearlySelected.value = state.value.billingInterval === BillingInterval.Yearly
  },
  { immediate: true }
)

onMounted(() => {
  mixpanel.track('Workspace Pricing Step Viewed')
})
</script>

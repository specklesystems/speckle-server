<template>
  <WorkspaceWizardStep title="Choose a plan">
    <div class="flex flex-col max-w-5xl w-full items-center">
      <div class="grid lg:grid-cols-3 gap-y-2 gap-x-2 w-full">
        <PricingTablePlan
          v-for="plan in plans"
          :key="plan"
          v-model:is-yearly-interval-selected="isYearlyIntervalSelected"
          :plan="plan"
          can-upgrade
          show-addons
          @on-yearly-interval-selected="onYearlyIntervalSelected"
        >
          <template #cta>
            <FormButton
              :color="plan === WorkspacePlans.Free ? 'primary' : 'outline'"
              full-width
              @click="onCtaClick(plan)"
            >
              {{
                plan === WorkspacePlans.Free
                  ? 'Get started for free'
                  : `Subscribe to ${formatName(plan)}`
              }}
            </FormButton>
          </template>
        </PricingTablePlan>
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
import { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'
import { WorkspacePlans, type PaidWorkspacePlans } from '@speckle/shared'
import { formatName } from '~/lib/billing/helpers/plan'

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()

const isYearlyIntervalSelected = defineModel<boolean>('isYearlyIntervalSelected', {
  default: false
})

const plans = computed(() => [
  WorkspacePlans.Free,
  WorkspacePlans.Team,
  WorkspacePlans.Pro
])

const onCtaClick = (plan: WorkspacePlans) => {
  state.value.plan = plan as unknown as PaidWorkspacePlans
  state.value.billingInterval =
    isYearlyIntervalSelected.value && plan !== WorkspacePlans.Free
      ? BillingInterval.Yearly
      : BillingInterval.Monthly

  mixpanel.track('Workspace Pricing Step Completed', {
    plan: state.value.plan,
    billingInterval: state.value.billingInterval
  })

  goToNextStep()
}

const onYearlyIntervalSelected = (newValue: boolean) => {
  isYearlyIntervalSelected.value = newValue
}

watch(
  () => state.value.billingInterval,
  (newVal) => {
    isYearlyIntervalSelected.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)

onMounted(() => {
  mixpanel.track('Workspace Pricing Step Viewed')
})
</script>

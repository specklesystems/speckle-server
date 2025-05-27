<template>
  <WorkspaceWizardStep
    title="Unlimited projects and models"
    description="Do you want to include the unlimited projects and models add-on?"
  >
    <div class="flex flex-col gap-4 w-full max-w-lg items-center">
      <FormRadioGroup v-model="includeUnlimitedAddon" :options="options" is-stacked />
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <div v-tippy="!includeUnlimitedAddon ? 'Please choose an option' : ''">
          <FormButton
            :disabled="!includeUnlimitedAddon"
            size="lg"
            full-width
            @click="onCtaClick"
          >
            Next
          </FormButton>
        </div>
        <FormButton color="subtle" size="lg" full-width @click.stop="goToPreviousStep">
          Back
        </FormButton>
      </div>
    </div>
  </WorkspaceWizardStep>
</template>

<script setup lang="ts">
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'
import { useMixpanel } from '~/lib/core/composables/mp'
import { type PaidWorkspacePlans, WorkspacePlans } from '@speckle/shared'
import { useWorkspaceAddonPrices } from '~/lib/billing/composables/prices'
import { Currency, BillingInterval } from '~/lib/common/generated/gql/graphql'
import { formatPrice } from '~/lib/billing/helpers/plan'

type AddonIncludedSelect = 'yes' | 'no'

const { goToNextStep, goToPreviousStep, state } = useWorkspacesWizard()
const mixpanel = useMixpanel()
const { addonPrices } = useWorkspaceAddonPrices()

const includeUnlimitedAddon = ref<AddonIncludedSelect | undefined>(undefined)

const addOnPrice = computed(() => {
  if (!state.value.plan) return null
  const price =
    addonPrices.value?.[Currency.Usd]?.[state.value.plan as PaidWorkspacePlans]
  if (!price) return null

  return formatPrice({
    amount:
      state.value.billingInterval === BillingInterval.Yearly
        ? price.yearly.amount / 12
        : price.monthly.amount,
    currency: Currency.Usd
  })
})

const options = computed(() => [
  {
    value: 'yes',
    title: `Yes`,
    subtitle: `Plus ${addOnPrice.value} per editor seat/month`
  },
  {
    value: 'no',
    title: 'No',
    subtitle: 'Maybe later'
  }
])

const onCtaClick = () => {
  const isTeamPlan =
    state.value.plan === WorkspacePlans.Team ||
    state.value.plan === WorkspacePlans.TeamUnlimited

  state.value.plan =
    includeUnlimitedAddon.value === 'yes'
      ? isTeamPlan
        ? WorkspacePlans.TeamUnlimited
        : WorkspacePlans.ProUnlimited
      : isTeamPlan
      ? WorkspacePlans.Team
      : WorkspacePlans.Pro

  mixpanel.track('Workspace Unlimited Addon Step Completed', {
    plan: state.value.plan,
    includesAddonPurchase: includeUnlimitedAddon.value
  })

  goToNextStep()
}

onMounted(() => {
  mixpanel.track('Workspace Unlimited Addon Step Viewed')
})
</script>

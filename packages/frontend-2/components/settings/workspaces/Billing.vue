<template>
  <section>
    <div class="md:max-w-4xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <template v-if="isBillingIntegrationEnabled">
        <div class="flex flex-col gap-y-4 md:gap-y-6">
          <SettingsSectionHeader title="Billing summary" subheading class="pt-4" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2 font-medium">
                {{ isTrialPeriod ? 'Trial plan' : 'Current plan' }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">
                {{ currentPlan?.name }} plan
              </h4>
              <p
                v-if="currentPlan?.name && subscription?.billingInterval"
                class="text-body-xs text-foreground-2"
              >
                £{{ seatPrice }} per seat/month, billed
                {{ subscription?.billingInterval }}
              </p>
            </CommonCard>
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2">
                {{
                  isTrialPeriod
                    ? 'Expected bill'
                    : subscription?.billingInterval === BillingInterval.Monthly
                    ? 'Monthly bill'
                    : 'Yearly bill'
                }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">Coming soon</h4>
            </CommonCard>
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2">
                {{ isTrialPeriod ? 'First payment due' : 'Next payment due' }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">
                {{
                  isPaidPlan
                    ? dayjs(subscription?.currentBillingCycleEnd).format('MMMM D, YYYY')
                    : 'Never'
                }}
              </h4>
              <p v-if="isPaidPlan" class="text-body-xs text-foreground-2">
                <span class="capitalize">{{ subscription?.billingInterval }}</span>
                billing period
              </p>
            </CommonCard>
          </div>

          <CommonCard v-if="isActivePlan" class="bg-foundation">
            <div class="flex flex-row gap-x-4 items-center">
              <p class="text-body-xs text-foreground-2 flex-1">
                View invoices, edit payment details, and manage your subscription from
                the billing portal
              </p>
              <FormButton
                color="outline"
                :icon-right="ArrowTopRightOnSquareIcon"
                @click="openCustomerPortal"
              >
                Open billing portal
              </FormButton>
            </div>
          </CommonCard>

          <SettingsSectionHeader title="Price plans" subheading class="pt-4" />
          <div class="flex items-center gap-x-4">
            <div class="flex-col pr-6 gap-y-1">
              <p class="text-body-xs font-medium text-foreground">Annual billing</p>
              <p class="text-body-xs text-foreground-2 leading-5 max-w-md">
                Choose annual billing for a 20% discount
              </p>
            </div>
            <FormSwitch
              v-model="isYearlyPlan"
              :show-label="false"
              name="annual billing"
            />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CommonCard
              v-for="pricingPlan in pricingPlans"
              :key="pricingPlan.name"
              class="gap-y-4"
            >
              <h4 class="text-heading text-foreground capitalize">
                {{ pricingPlan.name }}
              </h4>
              <FormButton
                color="outline"
                full-width
                @click="onUpgradePlanClick(pricingPlan.name)"
              >
                Upgrade
              </FormButton>
            </CommonCard>
          </div>
        </div>
      </template>

      <template v-else>
        <CommonCard class="text-body-xs bg-foundation">
          <p class="text-foreground font-medium">Workspaces are free while in beta.</p>
          <p class="pt-1">
            After the beta ends, your workspace will start a 30-day free trial. You'll
            have full access until either the trial expires or you upgrade to a paid
            plan.
          </p>
        </CommonCard>

        <SettingsSectionHeader
          title="What your workspace bill will look like after the trial ends"
          class="pt-6 pb-4 md:pt-10 md:pb-6"
          subheading
        />
        <BillingSummary v-if="billing?.cost" :workspace-cost="billing.cost" />
        <div
          v-if="discount && billing?.cost?.subTotal"
          class="flex mt-6 bg-foundation border-dashed border border-success"
        >
          <p class="flex-1 p-3">{{ discount.name }}</p>
          <p class="w-32 md:w-40 ml-4 p-3">
            £{{ billing.cost.subTotal * discount.amount }} / month
          </p>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery, useApolloClient } from '@vue/apollo-composable'
import {
  settingsWorkspaceBillingQuery,
  settingsWorkspacePricingPlansQuery,
  settingsWorkspaceBillingCustomerPortalQuery
} from '~/lib/settings/graphql/queries'
import { useIsBillingIntegrationEnabled } from '~/composables/globals'
import {
  WorkspacePlans,
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { isWorkspacePricingPlans } from '~/lib/settings/helpers/types'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    id
    plan {
      name
      status
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
    }
    billing {
      cost {
        subTotal
        total
        ...BillingSummary_WorkspaceCost
      }
    }
  }
`)

type SeatPrices = {
  [key in WorkspacePlans]: {
    [BillingInterval.Monthly]: number
    [BillingInterval.Yearly]: number
  }
}

const props = defineProps<{
  workspaceId: string
}>()

const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const isYearlyPlan = ref(false)
// TODO: get these from the backend when available
const seatPrices = ref<SeatPrices>({
  [WorkspacePlans.Team]: { monthly: 12, yearly: 10 },
  [WorkspacePlans.Pro]: { monthly: 40, yearly: 36 },
  [WorkspacePlans.Business]: { monthly: 79, yearly: 63 },
  [WorkspacePlans.Academia]: { monthly: 0, yearly: 0 },
  [WorkspacePlans.Unlimited]: { monthly: 0, yearly: 0 }
})

const { client: apollo } = useApolloClient()
const { result: workspaceResult } = useQuery(settingsWorkspaceBillingQuery, () => ({
  workspaceId: props.workspaceId
}))
const { result: pricingPlansResult } = useQuery(settingsWorkspacePricingPlansQuery)

const billing = computed(() => workspaceResult.value?.workspace.billing)
const discount = computed(() => billing.value?.cost?.discount)
const currentPlan = computed(() => workspaceResult.value?.workspace.plan)
const subscription = computed(() => workspaceResult.value?.workspace.subscription)
const isPaidPlan = computed(
  () =>
    currentPlan.value?.name !== WorkspacePlans.Academia &&
    currentPlan.value?.name !== WorkspacePlans.Unlimited
)
const isTrialPeriod = computed(
  () => currentPlan.value?.status === WorkspacePlanStatuses.Trial
)
const isActivePlan = computed(
  () =>
    currentPlan.value?.status !== WorkspacePlanStatuses.Trial &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Canceled
)
const seatPrice = computed(() =>
  currentPlan.value && subscription.value
    ? seatPrices.value[currentPlan.value?.name][subscription.value?.billingInterval]
    : 0
)
const pricingPlans = computed(() =>
  isWorkspacePricingPlans(pricingPlansResult.value?.workspacePricingPlans)
    ? pricingPlansResult.value?.workspacePricingPlans.workspacePlanInformation
    : undefined
)

const onUpgradePlanClick = (plan: WorkspacePlans) => {
  const cycle = isYearlyPlan.value ? BillingInterval.Yearly : BillingInterval.Monthly
  window.location.href = `/api/v1/billing/workspaces/${props.workspaceId}/checkout-session/${plan}/${cycle}`
}

const openCustomerPortal = async () => {
  // We need to fetch this on click because the link expires very quickly
  const result = await apollo.query({
    query: settingsWorkspaceBillingCustomerPortalQuery,
    variables: { workspaceId: props.workspaceId },
    fetchPolicy: 'no-cache'
  })

  if (result.data?.workspace.customerPortalUrl) {
    window.location.href = result.data.workspace.customerPortalUrl
  }
}
</script>

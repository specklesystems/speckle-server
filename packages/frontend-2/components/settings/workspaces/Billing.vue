<template>
  <section>
    <div class="md:max-w-4xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <template v-if="isBillingIntegrationEnabled">
        <BillingAlert
          v-if="workspaceResult && !isValidPlan"
          :workspace="workspaceResult.workspace"
          class="mb-4"
        />
        <div class="flex flex-col gap-y-4 md:gap-y-6">
          <SettingsSectionHeader title="Billing summary" subheading class="pt-4" />
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2 font-medium">
                {{ isTrialPeriod ? 'Trial plan' : 'Current plan' }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">
                {{ currentPlan?.name ?? WorkspacePlans.Team }} plan
              </h4>
              <p class="text-body-xs text-foreground-2">
                £{{ seatPrice }} per seat/month, billed
                {{
                  subscription?.billingInterval === BillingInterval.Yearly
                    ? 'yearly'
                    : 'monthly'
                }}
              </p>
            </CommonCard>
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2">
                {{
                  isTrialPeriod
                    ? 'Expected bill'
                    : subscription?.billingInterval === BillingInterval.Yearly
                    ? 'Yearly bill'
                    : 'Monthly bill'
                }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">Coming soon</h4>
            </CommonCard>
            <CommonCard class="gap-y-1 bg-foundation">
              <p class="text-body-xs text-foreground-2">
                {{ isTrialPeriod ? 'First payment due' : 'Next payment due' }}
              </p>
              <h4 class="text-heading-lg text-foreground capitalize">
                {{ nextPaymentDue }}
              </h4>
              <p v-if="isPaidPlan" class="text-body-xs text-foreground-2">
                <span class="capitalize">
                  {{
                    subscription?.billingInterval === BillingInterval.Yearly
                      ? 'Yearly'
                      : 'Monthly'
                  }}
                </span>
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
                @click="customerPortalRedirect(workspaceId)"
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

      <template v-else>Coming soon</template>
    </div>
  </section>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import {
  settingsWorkspaceBillingQuery,
  settingsWorkspacePricingPlansQuery
} from '~/lib/settings/graphql/queries'
import { useIsBillingIntegrationEnabled } from '~/composables/globals'
import {
  WorkspacePlans,
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { isWorkspacePricingPlans } from '~/lib/settings/helpers/types'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { SeatPrices } from '~/lib/billing/helpers/types'
import { seatPricesConfig } from '~/lib/billing/helpers/constants'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    ...BillingAlert_Workspace
    id
    plan {
      name
      status
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const isYearlyPlan = ref(false)
const seatPrices = ref<SeatPrices>(seatPricesConfig)

const route = useRoute()
const { result: workspaceResult } = useQuery(
  settingsWorkspaceBillingQuery,
  () => ({
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)
const { result: pricingPlansResult } = useQuery(
  settingsWorkspacePricingPlansQuery,
  null,
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)
const { customerPortalRedirect, upgradePlanRedirect, cancelCheckoutSession } =
  useBillingActions()

const currentPlan = computed(() => workspaceResult.value?.workspace.plan)
const subscription = computed(() => workspaceResult.value?.workspace.subscription)
const isPaidPlan = computed(
  () =>
    currentPlan.value?.name !== WorkspacePlans.Academia &&
    currentPlan.value?.name !== WorkspacePlans.Unlimited
)
const isTrialPeriod = computed(
  () =>
    currentPlan.value?.status === WorkspacePlanStatuses.Trial ||
    !!currentPlan.value?.status
)
const isActivePlan = computed(
  () =>
    currentPlan.value &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Trial &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Canceled
)
const isValidPlan = computed(
  () => currentPlan.value?.status === WorkspacePlanStatuses.Valid
)
const seatPrice = computed(() =>
  currentPlan.value && subscription.value
    ? seatPrices.value[currentPlan.value?.name][subscription.value?.billingInterval]
    : seatPrices.value[WorkspacePlans.Team][BillingInterval.Monthly]
)
const pricingPlans = computed(() =>
  isWorkspacePricingPlans(pricingPlansResult.value)
    ? pricingPlansResult.value?.workspacePricingPlans.workspacePlanInformation
    : undefined
)
const nextPaymentDue = computed(() =>
  currentPlan.value
    ? isPaidPlan.value
      ? dayjs(subscription.value?.currentBillingCycleEnd).format('MMMM D, YYYY')
      : 'Never'
    : dayjs().add(30, 'days').format('MMMM D, YYYY')
)
const onUpgradePlanClick = (plan: WorkspacePlans) => {
  upgradePlanRedirect({
    plan,
    cycle: isYearlyPlan.value ? BillingInterval.Yearly : BillingInterval.Monthly,
    workspaceId: props.workspaceId
  })
}

onMounted(() => {
  const paymentStatusQuery = route.query?.payment_status
  const sessionIdQuery = route.query?.session_id

  if (sessionIdQuery && String(paymentStatusQuery) === WorkspacePlanStatuses.Canceled) {
    cancelCheckoutSession(String(sessionIdQuery), props.workspaceId)
  }
})
</script>

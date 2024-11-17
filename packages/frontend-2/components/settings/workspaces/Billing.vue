<template>
  <section>
    <div class="md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <template v-if="isBillingIntegrationEnabled">
        <BillingAlert
          v-if="workspaceResult && !isValidPlan"
          :workspace="workspaceResult.workspace"
          class="mb-4"
        />
        <div class="flex flex-col gap-y-4 md:gap-y-6">
          <SettingsSectionHeader title="Billing summary" subheading class="pt-4" />
          <div class="border border-outline-3 rounded-lg">
            <div
              class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x"
            >
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-2">
                  {{ isTrialPeriod ? 'Trial plan' : 'Current plan' }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ currentPlan?.name ?? WorkspacePlans.Team }} plan
                </p>
                <p class="text-body-xs text-foreground-2">
                  £{{ seatPrice }} per seat/month, billed
                  {{
                    subscription?.billingInterval === BillingInterval.Yearly
                      ? 'yearly'
                      : 'monthly'
                  }}
                </p>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-2">
                  {{
                    isTrialPeriod
                      ? 'Expected bill'
                      : subscription?.billingInterval === BillingInterval.Yearly
                      ? 'Yearly bill'
                      : 'Monthly bill'
                  }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">Coming soon</p>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-2">
                  {{ isTrialPeriod ? 'First payment due' : 'Next payment due' }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ nextPaymentDue }}
                </p>
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
              </div>
            </div>
            <div
              v-if="isActivePlan"
              class="flex flex-row gap-x-4 p-5 items-center border-t border-outline-3"
            >
              <div class="text-body-xs gap-y-2 flex-1">
                <p class="font-medium text-foreground">Billing portal</p>
                <p class="text-foreground-2">
                  View invoices, edit payment details, and manage your subscription.
                </p>
              </div>

              <FormButton color="outline" @click="billingPortalRedirect(workspaceId)">
                Open billing portal
              </FormButton>
            </div>
          </div>

          <SettingsSectionHeader title="Upgrade your plan" subheading class="pt-4" />
          <SettingsWorkspacesBillingPricingPlans :workspace-id="workspaceId" />
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
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import { useIsBillingIntegrationEnabled } from '~/composables/globals'
import {
  WorkspacePlans,
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
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
const { billingPortalRedirect, cancelCheckoutSession } = useBillingActions()

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
    !currentPlan.value?.status
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
const nextPaymentDue = computed(() =>
  currentPlan.value
    ? isPaidPlan.value
      ? dayjs(subscription.value?.currentBillingCycleEnd).format('MMMM D, YYYY')
      : 'Never'
    : dayjs().add(30, 'days').format('MMMM D, YYYY')
)

onMounted(() => {
  const paymentStatusQuery = route.query?.payment_status
  const sessionIdQuery = route.query?.session_id

  if (sessionIdQuery && String(paymentStatusQuery) === WorkspacePlanStatuses.Canceled) {
    cancelCheckoutSession(String(sessionIdQuery), props.workspaceId)
  }
})
</script>

<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <template v-if="isBillingIntegrationEnabled">
        <div class="flex flex-col gap-y-4 md:gap-y-6">
          <BillingAlert
            v-if="
              workspaceResult &&
              workspaceResult.workspace?.plan?.status !== WorkspacePlanStatuses.Valid
            "
            :workspace="workspaceResult.workspace"
          />
          <SettingsSectionHeader title="Billing summary" subheading class="pt-4" />
          <div class="border border-outline-3 rounded-lg">
            <div
              class="grid grid-cols-1 md:grid-cols-3 divide-y divide-outline-3 md:divide-y-0 md:divide-x"
            >
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-2">
                  {{ isTrialPeriod ? 'Trial plan' : 'Current plan' }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ currentPlan?.name ?? WorkspacePlans.Starter }} plan
                </p>
                <p v-if="isPurchasablePlan" class="text-body-xs text-foreground-2">
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
                <p class="text-heading-lg text-foreground capitalize">
                  {{ isPurchasablePlan ? 'Coming soon' : 'Not applicable' }}
                </p>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-2">
                  {{
                    isTrialPeriod && isPurchasablePlan
                      ? 'First payment due'
                      : 'Next payment due'
                  }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ isPurchasablePlan ? nextPaymentDue : 'Not applicable' }}
                </p>
                <p v-if="isPurchasablePlan" class="text-body-xs text-foreground-2">
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
              v-if="isActivePlan && isPurchasablePlan"
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
          <SettingsWorkspacesBillingPricingTable
            class="pt-6"
            :workspace-id="workspaceId"
            :current-plan="currentPlan"
            :is-admin="isAdmin"
          >
            <template #title>
              <SettingsSectionHeader
                :title="isTrialPeriod ? 'Start your subscription' : 'Upgrade your plan'"
                subheading
              />
            </template>
          </SettingsWorkspacesBillingPricingTable>
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
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import { Roles } from '@speckle/shared'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    ...BillingAlert_Workspace
    id
    role
    plan {
      ...SettingsWorkspacesBillingPricingTable_WorkspacePlan
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
const { result: workspaceResult } = useQuery(
  settingsWorkspaceBillingQuery,
  () => ({
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)
const { billingPortalRedirect } = useBillingActions()

const seatPrices = ref({
  [WorkspacePlans.Starter]: pricingPlansConfig.plans[WorkspacePlans.Starter].cost,
  [WorkspacePlans.Plus]: pricingPlansConfig.plans[WorkspacePlans.Plus].cost,
  [WorkspacePlans.Business]: pricingPlansConfig.plans[WorkspacePlans.Business].cost
})

const currentPlan = computed(() => workspaceResult.value?.workspace.plan)
const subscription = computed(() => workspaceResult.value?.workspace.subscription)
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
const isPurchasablePlan = computed(
  () =>
    currentPlan.value?.name === WorkspacePlans.Starter ||
    currentPlan.value?.name === WorkspacePlans.Plus ||
    currentPlan.value?.name === WorkspacePlans.Business ||
    !currentPlan.value?.name // no plan equals pro trial plan
)
const seatPrice = computed(() =>
  currentPlan.value && subscription.value
    ? seatPrices.value[currentPlan.value.name as keyof typeof seatPrices.value][
        subscription.value.billingInterval
      ][Roles.Workspace.Member]
    : seatPrices.value[WorkspacePlans.Starter][BillingInterval.Monthly][
        Roles.Workspace.Member
      ]
)
const nextPaymentDue = computed(() =>
  currentPlan.value
    ? isPurchasablePlan.value
      ? dayjs(subscription.value?.currentBillingCycleEnd).format('MMMM D, YYYY')
      : 'Never'
    : dayjs().add(30, 'days').format('MMMM D, YYYY')
)
const isAdmin = computed(
  () => workspaceResult.value?.workspace.role === Roles.Workspace.Admin
)
</script>

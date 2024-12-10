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
              class="grid grid-cols-1 lg:grid-cols-3 divide-y divide-outline-3 lg:divide-y-0 lg:divide-x"
            >
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-1">
                  {{ statusIsTrial ? 'Trial plan' : 'Current plan' }}
                </h3>
                <div class="flex gap-x-2">
                  <p class="text-heading-lg text-foreground">
                    Workspace
                    <span class="capitalize">
                      {{ currentPlan?.name ?? WorkspacePlans.Starter }}
                    </span>
                  </p>
                  <div>
                    <CommonBadge v-if="statusIsTrial" rounded>TRIAL</CommonBadge>
                  </div>
                </div>
                <p v-if="isPurchasablePlan" class="text-body-xs text-foreground-2">
                  <span v-if="statusIsTrial">
                    <span class="line-through mr-1">
                      £{{ seatPrice[Roles.Workspace.Member] }} per seat/month
                    </span>
                    Free
                  </span>
                  <span v-else>
                    £{{ seatPrice[Roles.Workspace.Member] }} per seat/month, billed
                    {{
                      subscription?.billingInterval === BillingInterval.Yearly
                        ? 'annually'
                        : 'monthly'
                    }}
                  </span>
                </p>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-1">
                  {{
                    statusIsTrial
                      ? 'Expected bill'
                      : subscription?.billingInterval === BillingInterval.Yearly
                      ? 'Annual bill'
                      : 'Monthly bill'
                  }}
                </h3>
                <template v-if="statusIsTrial">
                  <p class="text-heading-lg text-foreground inline-block">
                    {{ billValue }} per month
                  </p>
                  <p class="text-body-xs text-foreground-2 flex gap-x-1 items-center">
                    {{ billDescription }}
                    <InformationCircleIcon
                      v-tippy="billTooltip"
                      class="w-4 h-4 text-foreground cursor-pointer"
                    />
                  </p>
                </template>
                <div v-else>
                  <button
                    class="text-heading-lg text-foreground"
                    @click="billingPortalRedirect(workspaceId)"
                  >
                    View on Stripe &#8599;
                  </button>
                </div>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-1">
                  {{
                    statusIsTrial && isPurchasablePlan
                      ? 'Trial ends'
                      : statusIsCanceled
                      ? 'Cancels'
                      : 'Next payment due'
                  }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ isPurchasablePlan ? nextPaymentDue : 'Never' }}
                </p>
                <p v-if="isPurchasablePlan" class="text-body-xs text-foreground-2">
                  <span v-if="statusIsTrial">Subscribe before this date</span>
                  <span v-else>
                    {{
                      subscription?.billingInterval === BillingInterval.Yearly
                        ? 'Annual'
                        : 'Monthly'
                    }}
                    billing period
                  </span>
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

          <SettingsSectionHeader
            :title="statusIsTrial ? 'Start your subscription' : 'Upgrade your plan'"
            subheading
            class="pt-4"
          />
          <SettingsWorkspacesBillingPricingTable
            :workspace-id="workspaceId"
            :current-plan="currentPlan"
            :active-billing-interval="subscription?.billingInterval"
            :is-admin="isAdmin"
            @on-plan-selected="onPlanSelected"
          />
        </div>

        <div class="mt-8 text-center text-foreground-2">
          Need help?
          <NuxtLink
            class="text-foreground"
            to="https://speckle.guide/workspaces/billing.html"
            external
            @click="() => mixpanel.track('Workspace Docs Link Clicked')"
          >
            <span class="hover:underline">Read the docs</span>
          </NuxtLink>
          or
          <a
            class="text-foreground hover:underline"
            href="mailto:billing@speckle.systems"
            @click="() => mixpanel.track('Workspace Support Link Clicked')"
          >
            contact support
          </a>
        </div>

        <SettingsWorkspacesBillingUpgradeDialog
          v-if="selectedPlanName && selectedPlanCycle && workspaceId"
          v-model:open="isUpgradeDialogOpen"
          :plan="selectedPlanName"
          :billing-interval="selectedPlanCycle"
          :workspace-id="workspaceId"
        />
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
  BillingInterval,
  type PaidWorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import { pricingPlansConfig } from '~/lib/billing/helpers/constants'
import { Roles } from '@speckle/shared'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { isPaidPlan } from '@/lib/billing/helpers/types'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    ...BillingAlert_Workspace
    id
    role
    plan {
      name
      status
      createdAt
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
    }
    team {
      items {
        id
        role
      }
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
const { billingPortalRedirect, redirectToCheckout } = useBillingActions()
const mixpanel = useMixpanel()

const seatPrices = ref({
  [WorkspacePlans.Starter]: pricingPlansConfig.plans[WorkspacePlans.Starter].cost,
  [WorkspacePlans.Plus]: pricingPlansConfig.plans[WorkspacePlans.Plus].cost,
  [WorkspacePlans.Business]: pricingPlansConfig.plans[WorkspacePlans.Business].cost
})
const selectedPlanName = ref<WorkspacePlans>()
const selectedPlanCycle = ref<BillingInterval>()
const isUpgradeDialogOpen = ref(false)

const workspace = computed(() => workspaceResult.value?.workspace)
const currentPlan = computed(() => workspace.value?.plan)
const subscription = computed(() => workspace.value?.subscription)
const statusIsTrial = computed(
  () =>
    currentPlan.value?.status === WorkspacePlanStatuses.Trial ||
    !currentPlan.value?.status
)
const statusIsCanceled = computed(
  () => currentPlan.value?.status === WorkspacePlanStatuses.Canceled
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
      ]
    : seatPrices.value[WorkspacePlans.Starter][BillingInterval.Monthly]
)
const nextPaymentDue = computed(() =>
  isPurchasablePlan.value
    ? subscription.value?.currentBillingCycleEnd
      ? dayjs(subscription.value?.currentBillingCycleEnd).format('MMMM D, YYYY')
      : dayjs(currentPlan.value?.createdAt).add(31, 'days').format('MMMM D, YYYY')
    : 'Never'
)
const isAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)
const guestSeatCount = computed(() =>
  workspace.value
    ? workspace.value.team.items.filter((user) => user.role === Roles.Workspace.Guest)
        .length
    : 0
)
const memberSeatCount = computed(() =>
  workspace.value ? workspace.value.team.items.length - guestSeatCount.value : 0
)
const billValue = computed(() => {
  const guestPrice = seatPrice.value[Roles.Workspace.Guest] * guestSeatCount.value
  const memberPrice = seatPrice.value[Roles.Workspace.Member] * memberSeatCount.value
  const totalPrice = guestPrice + memberPrice
  if (statusIsTrial.value) return `£${totalPrice}`
  return `£0`
})
const billDescription = computed(() => {
  const memberText =
    memberSeatCount.value > 1 ? `${memberSeatCount.value} members` : '1 member'
  const guestText =
    guestSeatCount.value > 1 ? `${guestSeatCount.value} guests` : '1 guest'

  return `${memberText}${guestSeatCount.value > 0 ? `, ${guestText}` : ''}`
})
const billTooltip = computed(() => {
  const memberText = `${memberSeatCount.value} member${
    memberSeatCount.value === 1 ? '' : 's'
  } at £${seatPrice.value[Roles.Workspace.Member]}/month`
  const guestText = `${guestSeatCount.value} guest${
    guestSeatCount.value === 1 ? '' : 's'
  } at £${seatPrice.value[Roles.Workspace.Guest]}/month`

  return `${memberText}${guestSeatCount.value > 0 ? `, ${guestText}` : ''}`
})

const onPlanSelected = (plan: { name: WorkspacePlans; cycle: BillingInterval }) => {
  const { name, cycle } = plan
  if (!isPaidPlan(name) || !props.workspaceId) return

  if (statusIsTrial.value) {
    mixpanel.track('Workspace Subscribe Button Clicked', {
      plan,
      cycle,
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
    })

    redirectToCheckout({
      plan: name as unknown as PaidWorkspacePlans,
      cycle,
      workspaceId: props.workspaceId
    })
  } else {
    selectedPlanName.value = name
    selectedPlanCycle.value = cycle
    isUpgradeDialogOpen.value = true
  }
}
</script>

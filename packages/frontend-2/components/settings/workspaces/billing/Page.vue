<!-- "Old" billing page, the component for the new workspace plans is in PageNew.vue -->
<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <FormButton
        v-if="isWorkspaceNewPlansEnabled && isServerAdmin"
        size="lg"
        class="!bg-pink-500 !border-pink-700 mb-4"
        @click="handleUpgradeClick"
      >
        𝓒𝓱𝓪𝓷𝓰𝓮 𝓽𝓸 𝓷𝓮𝔀 𝓹𝓵𝓪𝓷 💸
      </FormButton>
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <template v-if="isBillingIntegrationEnabled">
        <div class="flex flex-col gap-y-4 md:gap-y-6">
          <BillingAlert
            v-if="workspace && workspace?.plan?.status !== WorkspacePlanStatuses.Valid"
            :workspace="workspace"
          />
          <SettingsSectionHeader title="Billing summary" subheading class="pt-4" />
          <div class="border border-outline-3 rounded-lg">
            <div
              class="grid grid-cols-1 lg:grid-cols-3 divide-y divide-outline-3 lg:divide-y-0 lg:divide-x"
            >
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-1">
                  {{ summaryPlanHeading }}
                </h3>
                <div class="flex gap-x-2">
                  <p class="text-heading-lg text-foreground">
                    Workspace
                    <span class="capitalize">
                      {{ currentPlan?.name ?? WorkspacePlans.Starter }}
                    </span>
                  </p>
                  <div>
                    <CommonBadge v-if="showStatusBadge" rounded>TRIAL</CommonBadge>
                  </div>
                </div>
                <p v-if="isPurchasablePlan" class="text-body-xs text-foreground-2">
                  <span v-if="statusIsTrial">
                    <span class="line-through mr-1">
                      {{ formatPrice(seatPrice?.[Roles.Workspace.Member]) }} per
                      seat/month
                    </span>
                    Free
                  </span>
                  <span
                    v-else-if="currentPlan?.status === WorkspacePlanStatuses.Expired"
                  >
                    {{ formatPrice(seatPrice?.[Roles.Workspace.Member]) }} per
                    seat/month
                  </span>
                  <span v-else>
                    {{ formatPrice(seatPrice?.[Roles.Workspace.Member]) }} per
                    seat/month, billed
                    {{
                      subscription?.billingInterval === BillingInterval.Yearly
                        ? 'annually'
                        : 'monthly'
                    }}
                  </span>
                </p>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <template v-if="isPurchasablePlan || statusIsTrial">
                  <h3 class="text-body-xs text-foreground-2 pb-1">
                    {{ summaryBillHeading }}
                  </h3>
                  <p class="text-heading-lg text-foreground inline-block">
                    {{ summaryBillValue }} per
                    {{
                      subscription?.billingInterval === BillingInterval.Yearly
                        ? 'year'
                        : 'month'
                    }}
                  </p>
                  <p class="text-body-xs text-foreground-2 flex gap-x-1 items-center">
                    {{ summaryBillDescription }}
                    <InformationCircleIcon
                      v-tippy="billTooltip"
                      class="w-4 h-4 text-foreground cursor-pointer"
                    />
                  </p>
                </template>
                <template v-else>
                  <h3 class="text-body-xs text-foreground-2 pb-1">Expected bill</h3>
                  <p class="text-heading-lg text-foreground inline-block">
                    {{ isAcademiaPlan ? 'Free' : 'Not applicable' }}
                  </p>
                </template>
              </div>
              <div class="p-5 pt-4 flex flex-col gap-y-1">
                <h3 class="text-body-xs text-foreground-2 pb-1">
                  {{ summaryDateHeading }}
                </h3>
                <p class="text-heading-lg text-foreground capitalize">
                  {{ isPurchasablePlan ? nextPaymentDue : 'Never' }}
                </p>
                <p
                  v-if="showSummaryDateDescription"
                  class="text-body-xs text-foreground-2"
                >
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

              <FormButton color="outline" @click="billingPortalRedirect(workspace?.id)">
                Open billing portal
              </FormButton>
            </div>
          </div>

          <template v-if="isPurchasablePlan || statusIsTrial">
            <SettingsSectionHeader
              :title="pricingTableHeading"
              subheading
              class="pt-4"
            />
            <SettingsWorkspacesBillingPricingTable
              :workspace-id="workspace?.id"
              :current-plan="currentPlan"
              :active-billing-interval="subscription?.billingInterval"
              :is-admin="isAdmin"
              @on-plan-selected="onPlanSelected"
            />
          </template>
        </div>

        <div v-if="isInvoicedPlan" class="mt-8 text-foreground-2 text-body-xs">
          Need help?
          <a
            class="text-foreground hover:underline"
            href="mailto:billing@speckle.systems"
            @click="
              mixpanel.track('Workspace Support Link Clicked', {
                workspace_id: workspace?.id,
                plan: currentPlan?.name
              })
            "
          >
            Contact us
          </a>
        </div>
        <div
          v-else-if="isPurchasablePlan"
          class="mt-8 text-center text-foreground-2 text-body-xs"
        >
          Need help?
          <NuxtLink
            class="text-foreground"
            :to="guideBillingUrl"
            target="_blank"
            @click="
              mixpanel.track('Workspace Docs Link Clicked', {
                workspace_id: workspace?.id,
                plan: currentPlan?.name
              })
            "
          >
            <span class="hover:underline">Read the docs</span>
          </NuxtLink>
          or
          <a
            class="text-foreground hover:underline"
            href="mailto:billing@speckle.systems"
            @click="
              mixpanel.track('Workspace Support Link Clicked', {
                workspace_id: workspace?.id,
                plan: currentPlan?.name
              })
            "
          >
            contact support
          </a>
        </div>

        <SettingsWorkspacesBillingUpgradeDialog
          v-if="selectedPlanName && selectedPlanCycle && workspace?.id"
          v-model:open="isUpgradeDialogOpen"
          :plan="selectedPlanName"
          :billing-interval="selectedPlanCycle"
          :workspace-id="workspace.id"
        />
      </template>
      <template v-else>Coming soon</template>
    </div>
  </section>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { graphql } from '~/lib/common/generated/gql'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import { useIsBillingIntegrationEnabled } from '~/composables/globals'
import {
  WorkspacePlans,
  WorkspacePlanStatuses,
  BillingInterval,
  WorkspacePaymentMethod,
  type PaidWorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { PaidWorkspacePlansOld } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { InformationCircleIcon } from '@heroicons/vue/24/outline'
import { isPaidPlan } from '@/lib/billing/helpers/types'
import { useMixpanel } from '~/lib/core/composables/mp'
import { guideBillingUrl } from '~/lib/common/helpers/route'
import { adminUpdateWorkspacePlanMutation } from '~/lib/billing/graphql/mutations'
import { useWorkspacePlanPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/prices'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    ...BillingAlert_Workspace
    id
    role
    plan {
      name
      status
      createdAt
      paymentMethod
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
      seats {
        guest
        plan
      }
    }
    team {
      items {
        id
        role
      }
    }
  }
`)

const slug = computed(() => (route.params.slug as string) || '')

const { prices } = useWorkspacePlanPrices()
const { isAdmin: isServerAdmin } = useActiveUser()
const route = useRoute()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const { result: workspaceResult } = useQuery(
  settingsWorkspaceBillingQuery,
  () => ({
    slug: slug.value
  }),
  () => ({
    enabled: isBillingIntegrationEnabled
  })
)
const { billingPortalRedirect, redirectToCheckout } = useBillingActions()
const mixpanel = useMixpanel()
const { mutate: mutateWorkspacePlan } = useMutation(adminUpdateWorkspacePlanMutation)

const selectedPlanName = ref<PaidWorkspacePlansOld>()
const selectedPlanCycle = ref<BillingInterval>()
const isUpgradeDialogOpen = ref(false)

const seatPrices = computed(() => ({
  [WorkspacePlans.Starter]: prices.value?.[WorkspacePlans.Starter],
  [WorkspacePlans.Plus]: prices.value?.[WorkspacePlans.Plus],
  [WorkspacePlans.Business]: prices.value?.[WorkspacePlans.Business]
}))
const workspace = computed(() => workspaceResult.value?.workspaceBySlug)
const currentPlan = computed(() => workspace.value?.plan)
const subscription = computed(() => workspace.value?.subscription)
const statusIsTrial = computed(
  () =>
    currentPlan.value?.status === WorkspacePlanStatuses.Trial ||
    !currentPlan.value?.status
)
const isActivePlan = computed(
  () =>
    currentPlan.value &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Trial &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Canceled &&
    currentPlan.value?.status !== WorkspacePlanStatuses.Expired
)

const isAcademiaPlan = computed(
  () => currentPlan.value?.name === WorkspacePlans.Academia
)
const isPurchasablePlan = computed(() => isPaidPlan(currentPlan.value?.name))
const seatPrice = computed(() =>
  currentPlan.value && subscription.value
    ? seatPrices.value?.[currentPlan.value.name as keyof typeof seatPrices.value]?.[
        subscription.value.billingInterval
      ]
    : seatPrices.value?.[WorkspacePlans.Starter]?.[BillingInterval.Monthly]
)
const nextPaymentDue = computed(() =>
  isPurchasablePlan.value
    ? subscription.value?.currentBillingCycleEnd
      ? dayjs(subscription.value?.currentBillingCycleEnd).format('MMMM D, YYYY')
      : dayjs(currentPlan.value?.createdAt).add(31, 'days').format('MMMM D, YYYY')
    : 'Never'
)
const isInvoicedPlan = computed(
  () => currentPlan.value?.paymentMethod === WorkspacePaymentMethod.Invoice
)
const isAdmin = computed(() => workspace.value?.role === Roles.Workspace.Admin)
const guestSeatCount = computed(() =>
  isActivePlan.value
    ? workspace.value?.subscription?.seats.guest ?? 0
    : workspace.value?.team.items.filter((user) => user.role === Roles.Workspace.Guest)
        .length ?? 0
)
const memberSeatCount = computed(() =>
  isActivePlan.value
    ? workspace.value?.subscription?.seats.plan ?? 0
    : workspace.value
    ? workspace.value.team.items.length - guestSeatCount.value
    : 0
)
const summaryBillValue = computed(() => {
  if (!seatPrice.value) return 'loading'
  const guestPrice =
    seatPrice.value[Roles.Workspace.Guest].amount * guestSeatCount.value
  const memberPrice =
    seatPrice.value[Roles.Workspace.Member].amount * memberSeatCount.value
  const totalPrice = guestPrice + memberPrice
  const isAnnual = subscription.value?.billingInterval === BillingInterval.Yearly
  return isPurchasablePlan.value ? `£${isAnnual ? totalPrice * 12 : totalPrice}` : '£0'
})
const summaryBillDescription = computed(() => {
  const memberText =
    memberSeatCount.value > 1 ? `${memberSeatCount.value} members` : '1 member'
  const guestText =
    guestSeatCount.value > 1 ? `${guestSeatCount.value} guests` : '1 guest'

  return `${memberText}${guestSeatCount.value > 0 ? `, ${guestText}` : ''}`
})
const billTooltip = computed(() => {
  if (!seatPrice.value) return undefined

  const memberText = `${memberSeatCount.value} member${
    memberSeatCount.value === 1 ? '' : 's'
  } at ${formatPrice(seatPrice.value[Roles.Workspace.Member])}/month`
  const guestText = `${guestSeatCount.value} guest${
    guestSeatCount.value === 1 ? '' : 's'
  } at ${formatPrice(seatPrice.value[Roles.Workspace.Guest])}/month`

  return `${memberText}${guestSeatCount.value > 0 ? `, ${guestText}` : ''}`
})
const summaryPlanHeading = computed(() => {
  switch (currentPlan.value?.status) {
    case WorkspacePlanStatuses.Trial:
      return 'Trial plan'
    case WorkspacePlanStatuses.Expired:
    case WorkspacePlanStatuses.Canceled:
      return 'Plan'
    default:
      return 'Current plan'
  }
})
const summaryBillHeading = computed(() => {
  switch (currentPlan.value?.status) {
    case WorkspacePlanStatuses.Trial:
    case WorkspacePlanStatuses.Expired:
    case WorkspacePlanStatuses.Canceled:
      return 'Expected bill'
    default:
      return subscription.value?.billingInterval === BillingInterval.Yearly
        ? 'Annual bill'
        : 'Monthly bill'
  }
})
const summaryDateHeading = computed(() => {
  if (statusIsTrial.value && isPurchasablePlan.value) {
    return 'Trial ends'
  } else if (currentPlan.value?.status === WorkspacePlanStatuses.Expired) {
    return 'Trial expired at'
  } else if (currentPlan.value?.status === WorkspacePlanStatuses.Canceled) {
    return 'Cancels'
  } else {
    return 'Next payment due'
  }
})
const showSummaryDateDescription = computed(() => {
  return statusIsTrial.value && isPurchasablePlan.value
})

const pricingTableHeading = computed(() => {
  switch (currentPlan.value?.status) {
    case WorkspacePlanStatuses.Trial:
    case WorkspacePlanStatuses.Expired:
      return 'Start your subscription'
    case WorkspacePlanStatuses.Canceled:
      return 'Restart your subscription'
    default:
      return 'Upgrade your plan'
  }
})
const showStatusBadge = computed(() => {
  return (
    (statusIsTrial.value ||
      currentPlan.value?.status === WorkspacePlanStatuses.Expired) &&
    isPurchasablePlan.value
  )
})

const onPlanSelected = (plan: {
  name: PaidWorkspacePlansOld
  cycle: BillingInterval
}) => {
  const { name, cycle } = plan
  if (!isPaidPlan(name) || !workspace.value?.id) return

  if (
    statusIsTrial.value ||
    currentPlan.value?.status === WorkspacePlanStatuses.Expired ||
    currentPlan.value?.status === WorkspacePlanStatuses.Canceled
  ) {
    mixpanel.track('Workspace Subscribe Button Clicked', {
      plan,
      cycle,
      // eslint-disable-next-line camelcase
      workspace_id: workspace.value?.id
    })

    redirectToCheckout({
      plan: name as unknown as PaidWorkspacePlans,
      cycle,
      workspaceId: workspace.value?.id
    })
  } else {
    selectedPlanName.value = name
    selectedPlanCycle.value = cycle
    isUpgradeDialogOpen.value = true
  }
}

const handleUpgradeClick = () => {
  if (!workspace.value?.id) return
  // Temporary hack to change workspace plans to the new free plan
  mutateWorkspacePlan({
    input: {
      workspaceId: workspace.value?.id,
      plan: WorkspacePlans.Free,
      status: WorkspacePlanStatuses.Valid
    }
  })
}
</script>

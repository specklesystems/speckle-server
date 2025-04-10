<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    <SettingsWorkspacesBillingAddOnsCard
      title="Unlimited projects and models"
      info="Add unlimited projects and models to your workspace."
      disclaimer="Only on Starter & Business plans"
      :buttons="[unlimitedAddOnButton]"
    >
      <template #subtitle>
        <p class="text-body pt-1">
          <span class="font-medium">$0</span>
          per editor/month
        </p>
        <div class="flex items-center gap-x-2 mt-3 px-1">
          <FormSwitch
            v-model="isYearlyIntervalSelected"
            :show-label="false"
            name="billing-interval"
          />
          <span class="text-body-2xs">Billed yearly</span>
          <CommonBadge rounded color-classes="text-foreground-2 bg-primary-muted">
            -10%
          </CommonBadge>
        </div>
      </template>
    </SettingsWorkspacesBillingAddOnsCard>

    <SettingsWorkspacesBillingAddOnsCard
      title="Extra data regions"
      subtitle="Talk to us"
      info="Access to almost all data residency regions."
      disclaimer="Only on Business plan"
      :buttons="[contactButton]"
    />

    <SettingsWorkspacesBillingAddOnsCard
      title="Priority support"
      subtitle="Talk to us"
      info="Private support channel for your workspace."
      disclaimer="Only on Business plan"
      :buttons="[contactButton]"
    />
  </div>
</template>

<script lang="ts" setup>
import { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { isPaidPlan } from '@speckle/shared'

const props = defineProps<{
  slug: string
}>()

const isYearlyIntervalSelected = ref(false)
const { billingInterval, isBusinessPlan, plan } = useWorkspacePlan(props.slug)

const contactButton = computed(() => ({
  text: 'Contact us',
  id: 'contact-us',
  disabled: !isBusinessPlan.value,
  disabledMessage: 'Only available on the Business plan',
  onClick: () => {
    // TODO: Implement contact us
  }
}))

const unlimitedAddOnButton = computed(() => ({
  text: 'Buy add-on',
  id: 'buy-add-on',
  disabled: plan.value?.name ? !isPaidPlan(plan.value.name) : false,
  disabledMessage: 'Only available on Starter and Business plans',
  onClick: () => {
    // TODO: Implement checkout
  }
}))

watch(
  () => billingInterval.value,
  (newVal) => {
    isYearlyIntervalSelected.value = newVal === BillingInterval.Yearly
  },
  { immediate: true }
)
</script>

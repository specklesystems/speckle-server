<template>
  <section>
    <div class="md:max-w-xl md:mx-auto pb-6 md:pb-0">
      <SettingsSectionHeader title="Billing" text="Your workspace billing details" />
      <CommonCard class="text-body-xs bg-foundation">
        <p class="text-foreground font-medium">Workspaces are free while in beta.</p>
        <p class="pt-1">
          Once the beta period ends, your workspace will be converted to a free 30-day
          trial. You can keep using it for free until it expires or you upgrade.
        </p>
      </CommonCard>

      <SettingsSectionHeader
        title="What your workspace bill after the trial period will look like"
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
      <div class="p-3 mt-2 flex flex-col md:flex-row md:items-center">
        <p class="text-body-xs text-foreground flex-1">
          To learn more about our pricing plans
        </p>
        <div class="pt-4 md:pt-0 md:pl-4 md:w-40">
          <FormButton
            :external="true"
            to="mailto:hello@speckle.systems"
            color="primary"
          >
            Talk to us
          </FormButton>
        </div>
      </div>

      <div v-if="isBillingIntegrationEnabled" class="flex flex-col space-y-10">
        <SettingsSectionHeader title="Start payment" class="pt-10" subheading />
        <div class="flex items-center">
          <div class="flex-1 flex-col pr-6 gap-y-1">
            <p class="text-body-xs font-medium text-foreground">Billing cycle</p>
            <p class="text-body-xs text-foreground-2 leading-5 max-w-md">
              Choose an annual billing cycle for 20% off
            </p>
          </div>
          <FormSwitch v-model="isYearlyPlan" :show-label="true" name="annual billing" />
        </div>
        <div class="text-lg">Add the pricing table here</div>
        <div class="flex justify-between">
          <FormButton @click="teamCheckout">Team plan</FormButton>
          <FormButton @click="proCheckout">Pro plan</FormButton>
          <FormButton @click="businessCheckout">Business plan</FormButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { settingsWorkspaceBillingQuery } from '~/lib/settings/graphql/queries'
import { useIsBillingIntegrationEnabled } from '~/composables/globals'

graphql(`
  fragment SettingsWorkspacesBilling_Workspace on Workspace {
    billing {
      cost {
        subTotal
        total
        ...BillingSummary_WorkspaceCost
      }
    }
  }
`)

const props = defineProps<{
  workspaceId: string
}>()

const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
const isYearlyPlan = ref(false)

const checkoutUrl = (plan: string) =>
  `/api/v1/billing/workspaces/${
    props.workspaceId
  }/checkout-session/${plan}/${billingCycle()}`
const billingCycle = () => (isYearlyPlan.value ? 'yearly' : 'monthly')
const teamCheckout = () => {
  window.location.href = checkoutUrl('team')
}
const proCheckout = () => {
  window.location.href = checkoutUrl('pro')
}
const businessCheckout = () => {
  window.location.href = checkoutUrl('business')
}

const { result } = useQuery(settingsWorkspaceBillingQuery, () => ({
  workspaceId: props.workspaceId
}))

const billing = computed(() => result.value?.workspace.billing)
const discount = computed(() => billing.value?.cost?.discount)
</script>

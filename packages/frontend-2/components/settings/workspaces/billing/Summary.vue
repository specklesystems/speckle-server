<!-- TODO: Some content still missing, needs to be updated as functionality is added -->
<template>
  <div class="border border-outline-3 rounded-lg">
    <div
      class="grid grid-cols-1 lg:grid-cols-3 divide-y divide-outline-3 lg:divide-y-0 lg:divide-x"
    >
      <div class="p-5 pt-4 flex flex-col">
        <h3 class="text-body-xs text-foreground-2 pb-4">Current plan</h3>
        <p class="text-heading-lg text-foreground capitalize">
          {{ plan?.name }}
        </p>
      </div>

      <div class="p-5 pt-4 flex flex-col">
        <h3 class="text-body-xs text-foreground-2 pb-4">
          <template v-if="isPurchasablePlan">
            <span class="capitalize">{{ billingInterval }}</span>
            bill
          </template>
          <template v-else>Bill</template>
        </h3>
        <p class="text-heading-lg text-foreground inline-block">
          {{ totalCostFormatted }}
          <span v-if="isPurchasablePlan">per {{ billingInterval }}</span>
        </p>
        <NuxtLink
          v-if="showBillingPortalLink"
          class="text-body-xs text-foreground-2 underline hover:text-foreground cursor-pointer mt-1"
          @click="billingPortalRedirect(workspaceId)"
        >
          View cost breakdown
        </NuxtLink>
      </div>

      <div class="p-5 pt-4 flex flex-col">
        <h3 class="text-body-xs text-foreground-2 pb-4">Billing period</h3>
        <p class="text-heading-lg text-foreground capitalize">
          {{ isPurchasablePlan ? billingInterval : 'Not applicable' }}
        </p>
      </div>
    </div>

    <div
      v-if="showBillingPortalLink"
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
</template>

<script setup lang="ts">
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { useBillingActions } from '~/lib/billing/composables/actions'
import type { MaybeNullOrUndefined } from '@speckle/shared'

defineProps<{
  workspaceId?: MaybeNullOrUndefined<string>
}>()

const { billingPortalRedirect } = useBillingActions()
const route = useRoute()
const slug = computed(() => (route.params.slug as string) || '')

const { plan, isPurchasablePlan, isActivePlan, totalCostFormatted, billingInterval } =
  useWorkspacePlan(slug.value)

const showBillingPortalLink = computed(
  () => isActivePlan.value && isPurchasablePlan.value
)
</script>

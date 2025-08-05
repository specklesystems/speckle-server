<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="title"
    :buttons="dialogButtons"
    max-width="md"
  >
    <SettingsWorkspacesBillingUpgradeDialogSelectAddOn
      v-if="showAddonSelect"
      v-model:include-unlimited-addon="includeUnlimitedAddon"
      :slug="slug"
      :plan="finalNewPlan"
      :billing-interval="billingInterval"
      :enable-no-option="!forceAddonPurchase"
    />
    <SettingsWorkspacesBillingUpgradeDialogSummary
      v-else
      :slug="slug"
      :plan="finalNewPlan"
      :billing-interval="billingInterval"
      :editor-seat-count="editorSeatCount"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useBillingActions } from '~/lib/billing/composables/actions'
import {
  PaidWorkspacePlans,
  WorkspacePlanConfigs,
  type MaybeNullOrUndefined,
  doesPlanIncludeUnlimitedProjectsAddon
} from '@speckle/shared'
import type { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'
import { useMixpanel } from '~/lib/core/composables/mp'
import { useFeatureFlags } from '~/lib/common/composables/env'

type AddonIncludedSelect = 'yes' | 'no'

const props = defineProps<{
  plan: PaidWorkspacePlans
  billingInterval: BillingInterval
  workspaceId: MaybeNullOrUndefined<string>
  slug: string
  isChangingPlan?: boolean
}>()
const isOpen = defineModel<boolean>('open', { required: true })
const includeUnlimitedAddon = defineModel<AddonIncludedSelect | undefined>(
  'includeUnlimitedAddon',
  {
    default: null
  }
)

const { upgradePlan, redirectToCheckout } = useBillingActions()
const { hasUnlimitedAddon, plan, subscription, statusIsCanceled, seats } =
  useWorkspacePlan(props.slug)
const mixpanel = useMixpanel()
const { projectCount, modelCount } = useWorkspaceUsage(props.slug)
const featureFlags = useFeatureFlags()

const showAddonSelect = ref<boolean>(true)
const isLoading = ref<boolean>(false)

const title = computed(() => {
  if (showAddonSelect.value) {
    if (hasUnlimitedAddon.value) {
      return usageExceedsNewPlanLimit.value
        ? 'Unlimited Projects and Models add-on is required'
        : 'Do you want to keep Unlimited Projects and Models add-on?'
    }

    return 'Do you want the Unlimited Projects and Models add-on?'
  }

  return 'Confirm changes to your plan'
})

const usageExceedsNewPlanLimit = computed(() => {
  const limits = WorkspacePlanConfigs({ featureFlags })[props.plan].limits
  const modelLimit = limits.modelCount
  const projectLimit = limits.projectCount

  if (!modelLimit || !projectLimit) return true
  return modelCount.value > modelLimit || projectCount.value > projectLimit
})

const forceAddonPurchase = computed(() => {
  return (
    usageExceedsNewPlanLimit.value ||
    (statusIsCanceled.value && hasUnlimitedAddon.value)
  )
})

const isSamePlanWithAddon = computed(
  () => plan.value?.name === props.plan && hasUnlimitedAddon.value
)

// If the user has selected to include the add-on, return the new plan with the add-on
const finalNewPlan = computed(() => {
  if (includeUnlimitedAddon.value === 'yes') {
    return props.plan === PaidWorkspacePlans.Team
      ? PaidWorkspacePlans.TeamUnlimited
      : PaidWorkspacePlans.ProUnlimited
  }

  return props.plan
})

const editorSeatCount = computed(() => seats.value?.editors.assigned || 0)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: backButtonText.value,
    props: { color: 'outline' },
    onClick: () => {
      if (showAddonSelect.value || !props.isChangingPlan) {
        isOpen.value = false
      } else {
        showAddonSelect.value = true
      }
    }
  },
  {
    text: nextButtonText.value,
    props: {
      color: 'primary',
      loading: isLoading.value
    },
    disabled: showAddonSelect.value
      ? includeUnlimitedAddon.value === null
      : isLoading.value,
    onClick: () => {
      if (showAddonSelect.value) {
        showAddonSelect.value = false
      } else {
        onSubmit()
      }
    }
  }
])

const backButtonText = computed(() => (showAddonSelect.value ? 'Cancel' : 'Back'))
const nextButtonText = computed(() =>
  showAddonSelect.value || statusIsCanceled.value ? 'Continue' : 'Continue and upgrade'
)

const onSubmit = async () => {
  if (!props.workspaceId) return

  isLoading.value = true
  if (!subscription.value || statusIsCanceled.value) {
    mixpanel.track('Workspace Creation Checkout Session Started')

    redirectToCheckout({
      plan: finalNewPlan.value,
      cycle: props.billingInterval,
      workspaceId: props.workspaceId
    })
  } else {
    if (props.isChangingPlan) {
      mixpanel.track('Workspace Upgrade Button Clicked', {
        plan: finalNewPlan.value,
        cycle: props.billingInterval,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspaceId,
        includesUnlimitedAddon: doesPlanIncludeUnlimitedProjectsAddon(
          finalNewPlan.value
        )
      })
    } else {
      mixpanel.track('Add-on Purchase Button Clicked', {
        plan: finalNewPlan.value,
        cycle: props.billingInterval,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspaceId
      })
    }

    await upgradePlan({
      plan: finalNewPlan.value,
      cycle: props.billingInterval,
      workspaceId: props.workspaceId
    })

    isLoading.value = false
  }

  isOpen.value = false
}

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      showAddonSelect.value = props.isChangingPlan && !isSamePlanWithAddon.value
      // If the add-on is required or already included, set it to yes
      if (usageExceedsNewPlanLimit.value && props.isChangingPlan) {
        includeUnlimitedAddon.value = 'yes'
      } else {
        includeUnlimitedAddon.value = undefined
      }
    }
  }
)
</script>

<template>
  <LayoutDialog
    v-model:open="isOpen"
    :title="title"
    :buttons="dialogButtons"
    max-width="md"
  >
    {{ isChangingPlan }}
    {{ isSamePlanWithAddon }}
    <SettingsWorkspacesBillingUpgradeDialogSelectAddOn
      v-if="showAddonSelect"
      v-model:include-unlimited-addon="includeUnlimitedAddon"
      :slug="slug"
      :plan="finalNewPlan"
      :billing-interval="billingInterval"
      :enable-no-option="!usageExceedsNewPlanLimit"
    />
    <SettingsWorkspacesBillingUpgradeDialogSummary
      v-else
      :slug="slug"
      :plan="finalNewPlan"
      :billing-interval="billingInterval"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useBillingActions } from '~/lib/billing/composables/actions'
import {
  PaidWorkspacePlansNew,
  WorkspacePlanConfigs,
  type MaybeNullOrUndefined
} from '@speckle/shared'
import type { BillingInterval } from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlan } from '~/lib/workspaces/composables/plan'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'

type AddonIncludedSelect = 'yes' | 'no'

const props = defineProps<{
  plan: PaidWorkspacePlansNew
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

const { upgradePlan } = useBillingActions()
const { hasUnlimitedAddon, plan } = useWorkspacePlan(props.slug)
const { projectCount, modelCount } = useWorkspaceUsage(props.slug)

const showAddonSelect = ref<boolean>(true)

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
  const limits = WorkspacePlanConfigs[props.plan].limits
  const modelLimit = limits.modelCount
  const projectLimit = limits.projectCount

  if (!modelLimit || !projectLimit) return true
  return modelCount.value > modelLimit || projectCount.value > projectLimit
})

const isSamePlanWithAddon = computed(
  () => plan.value?.name === props.plan && hasUnlimitedAddon.value
)

// If the user has selected to include the add-on, return the new plan with the add-on
const finalNewPlan = computed(() => {
  if (includeUnlimitedAddon.value === 'yes') {
    return props.plan === PaidWorkspacePlansNew.Team
      ? PaidWorkspacePlansNew.TeamUnlimited
      : PaidWorkspacePlansNew.ProUnlimited
  }

  return props.plan
})

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
      color: 'primary'
    },
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
  showAddonSelect.value ? 'Continue' : 'Continue and upgrade'
)

const onSubmit = () => {
  if (!props.workspaceId) return

  upgradePlan({
    plan: finalNewPlan.value,
    cycle: props.billingInterval,
    workspaceId: props.workspaceId
  })

  isOpen.value = false
}

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal) {
      showAddonSelect.value = props.isChangingPlan && !isSamePlanWithAddon.value
      // If the add-on is required or already included, set it to yes
      if (usageExceedsNewPlanLimit.value) {
        includeUnlimitedAddon.value = 'yes'
      } else {
        includeUnlimitedAddon.value = undefined
      }
    }
  }
)
</script>

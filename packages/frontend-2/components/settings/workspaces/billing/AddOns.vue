<!-- TODO: Implement final values, links and copy -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
    <CommonCard class="flex flex-col gap-y-3 p-6">
      <h3 class="text-body">Unlimited projects and models</h3>
      <p class="text-foreground-2 text-body-xs flex-1 mb-3">
        Add more projects and models to your workspace.
      </p>
      <FormButton color="outline" size="sm">Contact us</FormButton>
    </CommonCard>

    <CommonCard class="flex flex-col gap-y-3 p-6">
      <h3 class="text-body">Extra data regions</h3>
      <p class="text-foreground-2 text-body-xs flex-1 mb-3">
        Access to almost all data residency regions.
      </p>
      <FormButton v-if="planIsBusiness" color="outline" size="sm">
        Contact us
      </FormButton>
      <p v-else class="font-medium text-body-xs">Available only on Business plan</p>
    </CommonCard>

    <CommonCard class="flex flex-col gap-y-3 p-6">
      <h3 class="text-body">Priority support</h3>
      <p class="text-foreground-2 text-body-xs flex-1 mb-3">
        Private support channel for your workspace.
      </p>
      <FormButton v-if="planIsBusiness" color="outline" size="sm">
        Contact us
      </FormButton>
      <p v-else class="font-medium text-body-xs">Available only on Business plan</p>
    </CommonCard>
  </div>
</template>

<script lang="ts" setup>
import { useWorkspacePlan } from '~~/lib/workspaces/composables/plan'
import { PaidWorkspacePlansNew } from '@speckle/shared'

const props = defineProps<{
  slug: string
}>()

const { plan } = useWorkspacePlan(props.slug)

const planIsBusiness = computed(() => plan.value?.name === PaidWorkspacePlansNew.Pro)
</script>

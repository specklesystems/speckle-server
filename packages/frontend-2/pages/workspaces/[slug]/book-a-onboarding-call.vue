<template>
  <div>
    <div class="flex flex-col items-center justify-center p-4 relative">
      <h1 class="text-heading-xl text-foreground mb-3">
        <template v-if="!showEmbed">
          You've successfully upgrade your workspace!
        </template>
        <template v-else>Find a time</template>
      </h1>
      <template v-if="!showEmbed">
        <p class="text-body-sm text-foreground-2">
          Do you want to schedule a personal onboarding call?
        </p>
        <div class="flex flex-col gap-3 w-full md:max-w-96 mt-8">
          <FormRadioGroup v-model="bookDemoSelected" :options="options" is-stacked />
        </div>
      </template>
      <div v-else class="w-full mt-8 mb-6">
        <CalWidget />
      </div>
      <div class="flex flex-col gap-3 mt-4 w-full md:max-w-96">
        <div
          v-if="!showEmbed"
          v-tippy="!bookDemoSelected ? 'Please select an option' : ''"
          class="w-full"
        >
          <FormButton
            size="lg"
            submit
            full-width
            :disabled="!bookDemoSelected"
            @click="onCtaClick"
          >
            Continue
          </FormButton>
        </div>
        <FormButton v-else size="lg" full-width @click="navigateTo(homeRoute)">
          Continue
        </FormButton>
        <FormButton size="lg" color="subtle" full-width @click="navigateTo(homeRoute)">
          Skip
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { homeRoute } from '~/lib/common/helpers/route'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { graphql } from '~~/lib/common/generated/gql'
import type { WorkspaceWizardState } from '~/lib/workspaces/helpers/types'
import { useWorkspacesWizard } from '~/lib/workspaces/composables/wizard'

type BookDemoSelect = 'yes' | 'no'

const bookAOnboardingCallQuery = graphql(`
  query BookAOnboardingCall($slug: String!) {
    workspaceBySlug(slug: $slug) {
      id
      creationState {
        completed
        state
      }
      plan {
        name
        status
      }
      subscription {
        billingInterval
      }
    }
  }
`)

definePageMeta({
  middleware: ['auth', 'require-valid-workspace']
})

const { $intercom } = useNuxtApp()
const mixpanel = useMixpanel()
const route = useRoute()
const router = useRouter()
const { finalizeWizard } = useWorkspacesWizard()
const { onResult } = useQuery(bookAOnboardingCallQuery, () => ({
  slug: route.params.slug as string
}))

const bookDemoSelected = ref<BookDemoSelect | undefined>(undefined)
const showEmbed = ref(false)

const options = computed(() => [
  {
    value: 'yes',
    title: `Yes, help me get started`,
    subtitle: 'Schedule your onboarding call in the next step'
  },
  {
    value: 'no',
    title: 'No, thank you'
  }
])

const onCtaClick = () => {
  if (bookDemoSelected.value === 'yes') {
    showEmbed.value = true
    mixpanel.track('Booking Calendar Triggered', {
      location: 'book-a-onboarding-call-page'
    })
  } else {
    mixpanel.track('Book A Onboarding Call Skipped')
    navigateTo(homeRoute)
  }
}

onMounted(() => {
  mixpanel.track('Book A Onboarding Call Page Viewed')
})

onResult((queryResult) => {
  if (queryResult.data?.workspaceBySlug) {
    if (
      queryResult.data?.workspaceBySlug.creationState?.completed === false &&
      queryResult.data.workspaceBySlug.creationState.state &&
      import.meta.client
    ) {
      const workspace = queryResult.data.workspaceBySlug
      finalizeWizard(
        workspace.creationState?.state as WorkspaceWizardState,
        workspace.id
      )

      /* eslint-disable camelcase */
      $intercom.track('Workspace Upgraded', {
        plan: workspace.plan?.name,
        cycle: workspace.subscription?.billingInterval,
        workspace_id: workspace.id,
        isExistingSubscription: false
      })
      $intercom.updateCompany({
        id: workspace.id,
        plan_name: workspace.plan?.name,
        plan_status: workspace.plan?.status,
        cycle: workspace.subscription?.billingInterval
      })
      /* eslint-enable camelcase */

      const currentQueryParams = { ...route.query }
      delete currentQueryParams.session_id
      delete currentQueryParams.payment_status
      router.push({ query: currentQueryParams })
    }
  }
})
</script>

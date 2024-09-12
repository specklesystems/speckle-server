<template>
  <div class="position left-2 bottom-2 fixed z-[45]">
    <div
      v-if="showBanner"
      class="rounded-lg flex flex-col gap-y-2 max-w-64 p-4 border border-outline-2 shadow-md bg-foundation-3 dark:bg-foundation"
    >
      <FormButton
        color="subtle"
        size="sm"
        class="absolute top-2 right-2 !w-5 !h-5 !p-0"
        @click="dismissedCookie = true"
      >
        <XMarkIcon class="h-5 w-5 text-foreground" />
      </FormButton>
      <h5 class="text-body-xs md:text-heading-sm text-foreground font-medium">
        Still not using workspaces?
      </h5>
      <p class="text-body-2xs leading-5 md:text-body-xs text-foreground-2">
        Be the first to reach better project management with your team
      </p>
      <FormButton
        class="mt-2"
        color="primary"
        size="sm"
        @click="openWorkspaceCreateDialog"
      >
        Start for free
      </FormButton>
    </div>
    <WorkspaceCreateDialog
      v-model:open="showWorkspaceCreateDialog"
      navigate-on-success
      event-source="promo-banner"
      @created="dismissedCookie = true"
    />
  </div>
</template>
<script setup lang="ts">
//This is a temporary component, to meassure if in app-notifications can be succesful

import { useMixpanel } from '~~/lib/core/composables/mp'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~/lib/common/helpers/constants'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { graphql } from '~~/lib/common/generated/gql'
import { promoBannersWorkspaceQuery } from '~/lib/promo-banners/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { XMarkIcon } from '@heroicons/vue/24/outline'

graphql(`
  fragment PromoBannersWorkspace_activeUser on User {
    workspaces {
      totalCount
    }
  }
`)

const isWorkspacesEnabled = useIsWorkspacesEnabled()
const mixpanel = useMixpanel()
const dismissedCookie = useSynchronizedCookie<boolean>(
  CookieKeys.DismissedWorkspaceBanner,
  {
    default: () => false
  }
)
const { result } = useQuery(promoBannersWorkspaceQuery, null, {
  enabled: isWorkspacesEnabled.value && !dismissedCookie.value
})

const showWorkspaceCreateDialog = ref(false)

const hasWorkspaces = computed(() => result.value?.activeUser.workspaces.totalCount > 0)
const showBanner = computed(
  () =>
    isWorkspacesEnabled &&
    !hasWorkspaces.value &&
    (import.meta.client ? !dismissedCookie.value : false)
)

const openWorkspaceCreateDialog = () => {
  showWorkspaceCreateDialog.value = true
  mixpanel.track('Create Workspace Button Clicked', {
    source: 'promo-banner'
  })
}

watch(
  showBanner,
  (newVal) => {
    if (newVal) {
      mixpanel.track('Workspace Promo Banner Viewed', {
        source: 'promo-banner'
      })
    }
  },
  { immediate: true }
)
</script>

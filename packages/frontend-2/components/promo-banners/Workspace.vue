<template>
  <ClientOnly>
    <div class="position left-2 sm:left-auto right-2 bottom-2 fixed z-[45]">
      <div
        v-if="showBanner"
        class="rounded-lg flex flex-col w-full sm:max-w-96 border border-outline-2 shadow-md bg-foundation-3 dark:bg-foundation"
      >
        <img :src="bannerImage" class="w-full" alt="Try workspaces" />
        <div class="px-5 py-6 flex flex-col gap-y-2">
          <h5 class="text-body-xs md:text-heading-sm text-foreground font-medium">
            Still not using workspaces?
          </h5>
          <p class="text-body-2xs leading-5 md:text-body-xs text-foreground-2">
            Be the first to reach more security options, data control, and better
            project management with your team.
          </p>
          <div class="flex items-center gap-x-2 mt-2">
            <FormButton color="primary" size="sm" @click="openWorkspaceCreateDialog">
              Start for free
            </FormButton>
            <FormButton color="subtle" size="sm" @click="dismissedCookie = true">
              Dismiss
            </FormButton>
          </div>
        </div>
        <WorkspaceCreateDialog
          v-model:open="showWorkspaceCreateDialog"
          navigate-on-success
          event-source="promo-banner"
          @created="dismissedCookie = true"
        />
      </div>
    </div>
  </ClientOnly>
</template>
<script setup lang="ts">
// This is a temporary component, to meassure if in app-notifications can be succesful
// It will be remove after a certain period, if we continue with in-app notification we should further develop this

import { useMixpanel } from '~~/lib/core/composables/mp'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'
import { CookieKeys } from '~/lib/common/helpers/constants'
import { useIsWorkspacesEnabled } from '~/composables/globals'
import { settingsSidebarQuery } from '~/lib/settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import { useTheme } from '~~/lib/core/composables/theme'
import { useBreakpoints } from '@vueuse/core'
import { TailwindBreakpoints } from '~~/lib/common/helpers/tailwind'
import imageLight from '~/assets/images/banners/workspace-promo-light.png'
import imageDark from '~/assets/images/banners/workspace-promo-dark.png'
import imageMobileLight from '~/assets/images/banners/workspace-promo-mobile-light.png'
import imageMobileDark from '~/assets/images/banners/workspace-promo-mobile-dark.png'

const breakpoints = useBreakpoints(TailwindBreakpoints)
const { isDarkTheme } = useTheme()
const isWorkspacesEnabled = useIsWorkspacesEnabled()
const mixpanel = useMixpanel()
const dismissedCookie = useSynchronizedCookie<boolean>(
  CookieKeys.DismissedWorkspaceBanner,
  {
    default: () => false
  }
)
const { result } = useQuery(settingsSidebarQuery, null, {
  enabled: isWorkspacesEnabled.value
})

const showWorkspaceCreateDialog = ref(false)
const isMobile = breakpoints.smaller('md')

const bannerImage = computed(() => {
  if (isMobile.value) {
    return isDarkTheme.value ? imageMobileDark : imageMobileLight
  }
  return isDarkTheme.value ? imageDark : imageLight
})
const hasWorkspaces = computed(() =>
  result.value?.activeUser?.workspaces.items
    ? result.value.activeUser.workspaces.items.length > 0
    : false
)
const showBanner = computed(
  () =>
    isWorkspacesEnabled.value &&
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

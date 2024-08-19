<template>
  <div>
    <div
      class="w-[calc(100vw-8px)] ml-[calc(50%-50vw+4px)] mr-[calc(50%-50vw+4px)] -mt-6 bg-foundation divide-y divide-outline-3 border-b border-outline-3"
    >
      <div v-if="showChecklist">
        <OnboardingChecklistV1 show-intro />
      </div>
      <ProjectsInviteBanners v-if="user?.projectInvites?.length" :invites="user" />
      <WorkspaceInviteBanners v-if="user?.workspaceInvites?.length" :invites="user" />
      <ProjectsNewSpeckleBanner
        v-if="showNewSpeckleBanner"
        @dismissed="onDismissNewSpeckleBanner"
      />
    </div>
    <PromoBannersWrapper v-if="promoBanners.length" :banners="promoBanners" />
  </div>
</template>
<script setup lang="ts">
import { useSynchronizedCookie } from '~/lib/common/composables/reactiveCookie'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectsDashboardHeader_UserFragment } from '~/lib/common/generated/gql/graphql'
import type { PromoBanner } from '~/lib/promo-banners/types'

graphql(`
  fragment ProjectsDashboardHeader_User on User {
    ...ProjectsInviteBanners
    ...WorkspaceInviteBanners_User
  }
`)

const props = defineProps<{
  user?: ProjectsDashboardHeader_UserFragment
}>()

const promoBanners = ref<PromoBanner[]>([
  {
    id: 'speckleverse',
    primaryText: 'Join our online hackathon!',
    secondaryText: 'June 7 - 9, 2024',
    url: 'https://beyond-the-speckleverse.devpost.com/',
    priority: 1,
    expiryDate: '2024-06-10'
  }
])

const hasCompletedChecklistV1 = useSynchronizedCookie<boolean>(
  `hasCompletedChecklistV1`,
  {
    default: () => false
  }
)

const hasDismissedChecklistTime = useSynchronizedCookie<string | undefined>(
  `hasDismissedChecklistTime`,
  { default: () => undefined }
)

const hasDismissedChecklistForever = useSynchronizedCookie<boolean | undefined>(
  `hasDismissedChecklistForever`,
  {
    default: () => false
  }
)

const hasDismissedChecklistTimeAgo = computed(() => {
  return (
    new Date().getTime() -
    new Date(hasDismissedChecklistTime.value || Date.now()).getTime()
  )
})

const hasDismissedNewSpeckleBanner = useSynchronizedCookie<boolean | undefined>(
  `hasDismissedNewSpeckleBanner`,
  { default: () => false }
)

const showChecklist = computed(() => {
  if (hasDismissedChecklistForever.value) return false
  if (hasCompletedChecklistV1.value) return false
  if (hasDismissedChecklistTime.value === undefined) return true
  if (
    hasDismissedChecklistTime.value !== undefined &&
    hasDismissedChecklistTimeAgo.value > 86400000
  )
    return true
  return false
})

const showNewSpeckleBanner = computed(() => {
  if (hasDismissedNewSpeckleBanner.value) return false
  if (props.user?.projectInvites.length || props.user?.workspaceInvites?.length)
    return false

  return true
})

const onDismissNewSpeckleBanner = () => {
  hasDismissedNewSpeckleBanner.value = true
}
</script>

<template>
  <HeaderWorkspaceSwitcherHeader
    :name="workspace?.name"
    :logo="workspace?.logo"
    :to="workspaceRoute(activeWorkspaceSlug || '')"
  >
    <p class="text-body-2xs text-foreground-2 truncate">Requires SSO authentication</p>
    <template #actions>
      <MenuItem>
        <FormButton color="outline" full-width size="sm" @click="handleSsoLogin">
          Sign in with SSO
        </FormButton>
      </MenuItem>
    </template>
  </HeaderWorkspaceSwitcherHeader>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import { graphql } from '~/lib/common/generated/gql'
import type { HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { workspaceRoute } from '~/lib/common/helpers/route'
import { useNavigation } from '~~/lib/navigation/composables/navigation'
import { useAuthManager, useLoginOrRegisterUtils } from '~/lib/auth/composables/auth'

graphql(`
  fragment HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspace on LimitedWorkspace {
    id
    slug
    name
    logo
  }
`)

defineProps<{
  workspace: MaybeNullOrUndefined<HeaderWorkspaceSwitcherHeaderExpiredSso_LimitedWorkspaceFragment>
}>()

const { activeWorkspaceSlug } = useNavigation()
const { signInOrSignUpWithSso } = useAuthManager()
const { challenge } = useLoginOrRegisterUtils()

const handleSsoLogin = () => {
  if (!activeWorkspaceSlug.value) return

  signInOrSignUpWithSso({
    workspaceSlug: activeWorkspaceSlug.value,
    challenge: challenge.value
  })
}
</script>

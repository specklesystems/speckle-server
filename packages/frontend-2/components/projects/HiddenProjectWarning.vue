<template>
  <CommonCard class="mb-4 bg-foundation text-body-xs !py-4">
    <p class="text-foreground">
      <span class="font-medium">
        {{ hiddenItemCount }} project{{ hiddenItemCount === 1 ? '' : 's' }}
        {{ hiddenItemCount === 1 ? 'is' : 'are' }} hidden
      </span>
      in SSO-protected workspaces. To view {{ hiddenItemCount === 1 ? 'it' : 'them' }},
      authenticate with:
    </p>
    <div class="flex gap-2 mt-2">
      <FormButton
        v-for="session in user.expiredSsoSessions"
        :key="session.id"
        size="sm"
        :to="workspaceSsoRoute(session.slug)"
        color="outline"
      >
        <div class="flex items-center gap-1">
          <WorkspaceAvatar
            size="2xs"
            :default-logo-index="session.defaultLogoIndex"
            :logo="session.logo"
          />
          {{ session.name }}
        </div>
      </FormButton>
    </div>
  </CommonCard>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsHiddenProjectWarning_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { workspaceSsoRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment ProjectsHiddenProjectWarning_User on User {
    id
    expiredSsoSessions {
      id
      slug
      name
      logo
      defaultLogoIndex
    }
  }
`)

defineProps<{
  hiddenItemCount: number
  user: ProjectsHiddenProjectWarning_UserFragment
}>()
</script>

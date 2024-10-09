<template>
  <div
    class="bg-foundation border border-outline-3 rounded-xl p-5 pb-4 flex flex-col gap-y-3"
  >
    <NuxtLink
      :to="projectRoute(project.id)"
      class="text-heading hover:text-primary truncate"
    >
      {{ project.name }}
    </NuxtLink>
    <div class="flex-1 gap-y-3">
      <p class="text-body-3xs text-foreground-2">
        <span class="capitalize">
          {{ project.role?.split(':').reverse()[0] }}
        </span>
        <span class="pl-1 pr-2">•</span>
        <span v-tippy="updatedAt.full">
          {{ updatedAt.relative }}
        </span>
      </p>
      <UserAvatarGroup :users="teamUsers" :max-count="4" class="pt-3 -ml-0.5" />
    </div>
    <div class="flex flex-col gap-y-3 pt-1">
      <NuxtLink
        v-if="project.workspace && isWorkspacesEnabled"
        :to="workspaceRoute(project.workspace.slug)"
        class="flex items-center"
      >
        <WorkspaceAvatar
          :logo="project.workspace.logo"
          :default-logo-index="project.workspace.defaultLogoIndex"
          size="sm"
        />
        <p class="text-body-2xs text-foreground ml-2">
          {{ project.workspace.name }}
        </p>
      </NuxtLink>
      <FormButton
        :to="allProjectModelsRoute(project.id)"
        size="sm"
        color="outline"
        :icon-right="ChevronRightIcon"
      >
        {{
          `${project.models.totalCount} ${
            project.models.totalCount === 1 ? 'model' : 'models'
          }`
        }}
      </FormButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { graphql } from '~~/lib/common/generated/gql'
import type { DashboardProjectCard_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { projectRoute, allProjectModelsRoute } from '~~/lib/common/helpers/route'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { workspaceRoute } from '~/lib/common/helpers/route'

graphql(`
  fragment DashboardProjectCard_Project on Project {
    id
    name
    role
    updatedAt
    models {
      totalCount
    }
    team {
      user {
        ...LimitedUserAvatar
      }
    }
    workspace {
      id
      slug
      name
      ...WorkspaceAvatar_Workspace
    }
  }
`)

const props = defineProps<{
  project: DashboardProjectCard_ProjectFragment
}>()

const isWorkspacesEnabled = useIsWorkspacesEnabled()

const projectId = computed(() => props.project.id)

useGeneralProjectPageUpdateTracking(
  { projectId },
  { redirectHomeOnProjectDeletion: false }
)

const teamUsers = computed(() => props.project.team.map((t) => t.user))
const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.project.updatedAt),
    relative: formattedRelativeDate(props.project.updatedAt, { capitalize: true })
  }
})
</script>

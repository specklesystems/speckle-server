<template>
  <div
    class="bg-foundation border border-1 border-outline-3 rounded-xl p-5 pb-4 flex flex-col gap-y-3"
  >
    <NuxtLink
      :to="projectRoute(project.id)"
      class="text-heading hover:text-primary truncate"
    >
      {{ project.name }}
    </NuxtLink>
    <div class="flex-1">
      <p class="text-body-3xs text-foreground-2 capitalize">
        {{ project.role?.split(':').reverse()[0] }}
        <span class="pl-1 pr-2">•</span>
        <span v-tippy="updatedAt.full">
          {{ updatedAt.relative }}
        </span>
      </p>
    </div>
    <UserAvatarGroup :users="teamUsers" :max-count="4" />
    <div>
      <FormButton
        :to="allProjectModelsRoute(project.id) + '/'"
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
        avatar
        id
        name
      }
    }
  }
`)

const props = defineProps<{
  project: DashboardProjectCard_ProjectFragment
}>()

const teamUsers = computed(() => props.project.team.map((t) => t.user))
const updatedAt = computed(() => {
  return {
    full: formattedFullDate(props.project.updatedAt),
    relative: formattedRelativeDate(props.project.updatedAt, { capitalize: true })
  }
})
</script>

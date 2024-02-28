<template>
  <div class="w-full md:w-72 rounded-md bg-foundation-2 shadow p-3">
    <div class="flex items-center">
      <div class="flex items-end justify-between w-full text-foreground-2">
        <div class="flex items-center gap-1 flex-grow select-none text-sm font-medium">
          <component :is="visibilityIcon" class="h-4 w-4" />
          {{ visibilityText }}
        </div>
        <div class="text-xs">
          {{ project.role?.split(':').reverse()[0] }}
        </div>
      </div>
    </div>
    <div class="flex items-center gap-4 justify-between mt-4">
      <UserAvatarGroup :users="teamUsers" class="max-w-[130px]" />
      <div v-if="project.role === 'stream:owner'">
        <FormButton :icon-left="UserPlusIcon" @click="emit('invite')">
          Invite
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  UsersIcon,
  LockClosedIcon,
  LinkIcon,
  UserPlusIcon
} from '@heroicons/vue/24/outline'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageStatsBlockTeamFragment } from '~~/lib/common/generated/gql/graphql'
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageStatsBlockTeam on Project {
    id
    role
    team {
      role
      user {
        ...LimitedUserAvatar
      }
    }
    ...ProjectPageTeamDialog
  }
`)

const emit = defineEmits(['invite'])

const props = defineProps<{
  project: ProjectPageStatsBlockTeamFragment
}>()

const teamUsers = computed(() => props.project.team.map((t) => t.user))

const visibilityText = computed(() => {
  switch (props.project.visibility) {
    case ProjectVisibility.Public:
      return 'Discoverable'
    case ProjectVisibility.Unlisted:
      return 'Anyone with the link'
    case ProjectVisibility.Private:
      return 'Invite Only'
    default:
      return 'Unknown'
  }
})

const visibilityIcon = computed(() => {
  switch (props.project.visibility) {
    case ProjectVisibility.Public:
      return UsersIcon
    case ProjectVisibility.Unlisted:
      return LinkIcon
    case ProjectVisibility.Private:
      return LockClosedIcon
    default:
      return UsersIcon
  }
})
</script>

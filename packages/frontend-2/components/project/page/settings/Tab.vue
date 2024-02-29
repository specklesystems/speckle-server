<template>
  <div>
    <LayoutPageTabs
      v-show="project"
      v-slot="{ activeItem }"
      :start-items="pageTabStartItems"
      :end-items="pageTabEndItems"
      vertical
      class="min-h-[500px]"
      title="Settings"
    >
      <ProjectPageSettingsManageUsers
        v-if="activeItem.id === 'users'"
        always-open
        :project="project"
        @invite="emit('invite')"
      />
      <ProjectPageSettingsManagePermissions
        v-if="activeItem.id === 'access'"
        :project="project"
        default-open
        condensed
      />
      <ProjectPageSettingsWebhooks
        v-if="activeItem.id === 'webhooks'"
        :project="project"
      />
      <ProjectPageSettingsLeaveProject
        v-if="activeItem.id === 'leave'"
        :project="project"
      />
      <ProjectPageSettingsDeleteProject
        v-if="activeItem.id === 'delete'"
        :project="project"
      />
    </LayoutPageTabs>
  </div>
</template>

<script setup lang="ts">
import type { ProjectPageSettingsFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'
import type { LayoutPageTabItem } from '@speckle/ui-components/dist/helpers/layout/components'
import {
  UsersIcon,
  TrashIcon,
  LockOpenIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

graphql(`
  fragment ProjectPageSettings on Project {
    id
    name
    role
    allowPublicComments
    visibility
    team {
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    invitedTeam {
      id
      title
      inviteId
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    ...ProjectsPageTeamDialogManagePermissions_Project
  }
`)

const props = defineProps<{
  project: ProjectPageSettingsFragment
}>()

const { canLeaveProject, isOwner } = useTeamDialogInternals({
  props: toRefs(props)
})

const emit = defineEmits(['invite'])

import { computed } from 'vue'

const pageTabStartItems = computed(() => {
  const items: LayoutPageTabItem[] = [
    {
      title: 'Users',
      id: 'users',
      icon: UsersIcon
    },
    {
      title: 'Access',
      id: 'access',
      icon: LockOpenIcon
    }
  ]

  if (isOwner.value) {
    items.push({
      title: 'Webhooks',
      id: 'webhooks',
      icon: LockOpenIcon
    })
  }

  return items
})

const pageTabEndItems = computed(() => {
  const items = []

  if (canLeaveProject.value) {
    items.push({
      title: 'Leave Project',
      id: 'leave',
      icon: ArrowRightOnRectangleIcon
    })
  }

  if (isOwner.value) {
    items.push({
      title: 'Delete Project',
      id: 'delete',
      icon: TrashIcon
    })
  }

  return items
})
</script>

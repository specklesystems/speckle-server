<template>
  <div>
    <div
      class="bg-foundation flex gap-2 p-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
    >
      <div class="flex flex-1 flex-col">
        <button class="flex items-center gap-2 cursor-pointer" @click="toggleAdmins">
          <p class="text-body-xs">Workspace admins</p>
          <ChevronDownIcon
            :class="`h-4 w-4 ${expanded ? '-rotate-180' : 'rotate-0'}`"
          />
        </button>
        <div v-if="expanded">
          <div
            v-for="admin in admins"
            :key="admin.user.id"
            class="flex gap-2 mt-1.5 items-center"
          >
            <UserAvatar :user="admin.user" />
            <p class="truncate text-body-xs">
              {{ admin.user.name }}
            </p>
            <CommonBadge v-if="adminIsYou(admin.user.id)" rounded color="secondary">
              You
            </CommonBadge>
          </div>
        </div>
      </div>
      <ProjectPageTeamPermissionSelect
        v-if="canEdit"
        class="shrink-0"
        :model-value="adminRole"
        :disabled-roles="[Roles.Stream.Contributor, Roles.Stream.Reviewer]"
        disabled-item-tooltip="Admin roles cant be changed"
      />
      <div v-else class="flex items-center justify-end text-body-2xs">
        {{ accessSelectItems[generalAccessRole].title }}
      </div>
    </div>
    <div
      class="bg-foundation flex items-center gap-2 p-3 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg"
    >
      <div class="flex flex-1">
        <p class="text-body-xs">Workspace members</p>
      </div>
      <ProjectPageTeamAccessSelect v-if="canEdit" :model-value="generalAccessRole" />
      <div v-else class="flex items-center justify-end text-body-2xs">
        {{ accessSelectItems[generalAccessRole].title }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  AccessSelectItems,
  accessSelectItems
} from '~~/lib/projects/helpers/components'
import type { ProjectPageCollaborators_WorkspaceCollaboratorFragment } from '~~/lib/common/generated/gql/graphql'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { Roles, type StreamRoles } from '@speckle/shared'
import { graphql } from '~~/lib/common/generated/gql'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

graphql(`
  fragment ProjectPageCollaborators_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    user {
      id
      name
      avatar
    }
  }
`)

defineProps<{
  canEdit: boolean
  admins: ProjectPageCollaborators_WorkspaceCollaboratorFragment[]
}>()

const { activeUser: user } = useActiveUser()

const expanded = ref(false)
const adminRole = ref<StreamRoles>(Roles.Stream.Owner)
const generalAccessRole = ref<AccessSelectItems>(AccessSelectItems.Reviewer)

const adminIsYou = (id: string) => id === user.value?.id
const toggleAdmins = () => {
  expanded.value = !expanded.value
}
</script>

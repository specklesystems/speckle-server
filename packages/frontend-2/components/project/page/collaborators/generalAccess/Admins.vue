<template>
  <div>
    <div
      class="bg-foundation gap-2 p-3 border-t border-x border-outline-3 rounded-t-lg flex flex-col"
    >
      <div class="flex items-center justify-between">
        <button
          class="flex flex-grow items-center gap-1 cursor-pointer"
          @click="toggleAdmins"
        >
          <p class="text-body-xs">Workspace admins</p>
          <ChevronDown
            :size="LucideSize.base"
            :stroke-width="1.5"
            :absolute-stroke-width="true"
            :class="` ${expanded ? '-rotate-180' : 'rotate-0'}`"
          />
        </button>
        <div
          v-tippy="
            'Workspace admins are automatically owners of all projects in the workspace. This project role cannot be changed.'
          "
          class="flex items-center justify-end text-body-2xs"
        >
          {{ roleSelectItems[Roles.Stream.Owner].title }}
        </div>
      </div>
      <div v-if="expanded" class="grid gap-1">
        <div
          v-for="admin in admins"
          :key="admin.user.id"
          class="flex gap-2 items-center"
        >
          <UserAvatar :user="admin.user" />
          <p class="truncate text-body-xs">
            {{ admin.user.name }}
            <span
              v-if="adminIsYou(admin.user.id)"
              class="text-foreground-3 text-body-3xs"
            >
              (you)
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { roleSelectItems } from '~~/lib/projects/helpers/components'
import type { ProjectPageCollaborators_WorkspaceCollaboratorFragment } from '~~/lib/common/generated/gql/graphql'
import { ChevronDown } from 'lucide-vue-next'
import { Roles } from '@speckle/shared'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

defineProps<{
  admins: ProjectPageCollaborators_WorkspaceCollaboratorFragment[]
}>()

const { activeUser: user } = useActiveUser()

const expanded = ref(false)

const adminIsYou = (id: string) => id === user.value?.id
const toggleAdmins = () => {
  expanded.value = !expanded.value
}
</script>

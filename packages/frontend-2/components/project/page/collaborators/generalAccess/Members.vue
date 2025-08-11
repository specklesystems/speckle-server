<template>
  <div
    class="bg-foundation gap-2 p-3 border border-outline-3 rounded-b-lg flex flex-col"
  >
    <div class="flex flex-1 items-center justify-between">
      <div class="flex flex-1 flex-col">
        <button class="flex items-center gap-1 cursor-pointer" @click="toggleExpanded">
          <p class="text-body-xs">Workspace members</p>
          <ChevronDown
            :size="LucideSize.base"
            :stroke-width="1.5"
            :absolute-stroke-width="true"
            :class="`${expanded ? '-rotate-180' : 'rotate-0'}`"
          />
        </button>
      </div>
      <div
        v-tippy="accessSelectItems[generalAccessRole].description"
        class="flex items-center justify-end text-body-2xs"
      >
        {{ accessSelectItems[generalAccessRole].title }}
      </div>
    </div>
    <div v-if="expanded" class="grid gap-3">
      <FormTextInput
        name="search"
        color="foundation"
        full-width
        show-clear
        :custom-icon="Search"
        placeholder="Search members..."
        v-bind="bind"
        v-on="on"
      />
      <div>
        <CommonLoadingIcon v-if="loading" class="mx-auto my-4" />
        <div v-else-if="members.length === 0">
          <p class="text-body-xs text-foreground-2">
            {{
              !!search
                ? 'No members found'
                : 'All workspace members are already part of this project'
            }}
          </p>
        </div>
        <div v-else class="grid gap-1">
          <div
            v-for="member in membersToShow"
            :key="member.user.id"
            class="flex justify-between items-center gap-2"
          >
            <div class="flex gap-2 items-center">
              <UserAvatar :user="member.user" />
              <p class="truncate text-body-xs">
                {{ member.user.name }}
              </p>
            </div>
            <FormButton
              v-if="canEdit"
              color="outline"
              size="sm"
              @click="
                onAddClick(member.user.id, member.user.workspaceRole, member.user.name)
              "
            >
              Add to project
            </FormButton>
          </div>
          <FormButton
            v-if="showLoadAllButton"
            color="subtle"
            size="sm"
            full-width
            @click="showAllMembers = true"
          >
            Show all ({{ members.length }})
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  AccessSelectItems,
  accessSelectItems
} from '~~/lib/projects/helpers/components'
import { ChevronDown, Search } from 'lucide-vue-next'
import { useDebouncedTextInput } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import { type MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { useInviteUserToProject } from '~~/lib/projects/composables/projectManagement'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import { SupportedProjectVisibility } from '~~/lib/projects/helpers/visibility'

const invitableCollaboratorsQuery = graphql(`
  query InvitableCollaborators(
    $projectId: String!
    $filter: InvitableCollaboratorsFilter
    $limit: Int!
    $workspaceId: String
  ) {
    project(id: $projectId) {
      invitableCollaborators(filter: $filter, limit: $limit) {
        totalCount
        items {
          user {
            id
            avatar
            name
            workspaceRole(workspaceId: $workspaceId)
          }
        }
      }
    }
  }
`)

const props = defineProps<{
  canEdit: boolean
  workspaceId: MaybeNullOrUndefined<string>
  projectVisibility: string
}>()

const { triggerNotification } = useGlobalToast()
const createInvite = useInviteUserToProject()
const route = useRoute()
const search = ref('')
const { on, bind } = useDebouncedTextInput({ model: search })
const projectId = computed(() => route.params.id as string)
const expanded = ref(false)
const { result, loading, refetch } = useQuery(
  invitableCollaboratorsQuery,
  () => ({
    projectId: projectId.value,
    filter: {
      search: search.value
    },
    limit: 500,
    workspaceId: props.workspaceId
  }),
  () => ({
    enabled: !!props.workspaceId && expanded.value
  })
)

const generalAccessRole = computed(() =>
  props.projectVisibility === SupportedProjectVisibility.Private
    ? AccessSelectItems.NoAccess
    : AccessSelectItems.Reviewer
)
const showAllMembers = ref(false)

const members = computed(() => {
  return (
    result.value?.project?.invitableCollaborators?.items.filter(
      (c) => c.user.workspaceRole === Roles.Workspace.Member
    ) || []
  )
})

const membersToShow = computed(() => {
  return showAllMembers.value || !!search.value
    ? members.value
    : members.value.slice(0, 15)
})

const showLoadAllButton = computed(() => {
  return !showAllMembers.value && members.value.length > 15 && !search.value
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const onAddClick = async (
  userId: string,
  workspaceRole: MaybeNullOrUndefined<string>,
  userName: string
) => {
  await createInvite(
    projectId.value,
    [
      {
        role: Roles.Stream.Reviewer,
        userId,
        workspaceRole
      }
    ],
    {
      hideToasts: true
    }
  )

  triggerNotification({
    type: ToastNotificationType.Success,
    title: `${userName} added as a project member`
  })

  refetch()
}
</script>

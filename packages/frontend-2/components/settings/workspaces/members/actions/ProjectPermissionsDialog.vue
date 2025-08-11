<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Manage project access</template>
    <div class="text-foreground mb-8">
      <div v-if="projectCount && projectCount > 0" class="flex flex-col gap-4">
        <p class="font-medium text-body-xs">
          Projects {{ user?.user.name }} has access to:
        </p>
        <FormTextInput
          v-bind="searchBind"
          name="searchGuests"
          color="foundation"
          type="text"
          size="lg"
          :placeholder="`Search ${projectCount} project${
            projectCount !== 1 ? 's' : ''
          }...`"
          class="px-3 py-2 border border-outline-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          v-on="searchOn"
        />
        <CommonCard
          class="border border-outline-3 bg-foundation-2 text-body-2xs !p-2 flex flex-col gap-2"
        >
          <div
            v-for="projectRole in filteredProjectRoles"
            :key="projectRole.project.id"
            class="flex items-center relative"
          >
            <div class="text-body-xs flex-1 relative z-10 mr-40">
              <NuxtLink
                :to="projectRoute(projectRole.project.id)"
                target="_blank"
                class="group flex gap-1 items-center max-w-max border-b border-transparent hover:border-gray-300/90"
              >
                {{ projectRole.project.name }}
                <ArrowUpRight
                  :size="LucideSize.sm"
                  :stroke-width="1.5"
                  :absolute-stroke-width="true"
                  class="hidden group-hover:block opacity-60"
                />
              </NuxtLink>
            </div>
            <div class="flex items-center gap-2 absolute right-0">
              <ProjectPageTeamPermissionSelect
                :model-value="projectRole.role"
                :disabled="false"
                mount-menu-on-body
                hide-owner
                show-remove
                @update:model-value="
                  (newRole) => updateProjectRole(projectRole.project.id, newRole)
                "
              />
              <FormButton
                color="outline"
                size="sm"
                @click="
                  () => {
                    projectToRemove = {
                      id: projectRole.project.id,
                      name: projectRole.project.name
                    }
                    showRemoveUserFromProjectConfirmationDialog = true
                  }
                "
              >
                Remove
              </FormButton>
            </div>
          </div>
        </CommonCard>
      </div>
      <div v-else>This user doesn't have access to any projects in this workspace.</div>
    </div>
    <LayoutDialog
      v-model:open="showRemoveUserFromProjectConfirmationDialog"
      :buttons="dialogButtons"
      max-width="xs"
    >
      <template #header>Remove user from project?</template>
      <CommonCard class="!p-2 border border-outline-3 bg-foundation-2">
        <div class="flex items-center gap-2">
          <UserAvatar :user="user?.user" />
          <div class="text-body-xs">
            {{ user?.user.name }}
          </div>
        </div>
      </CommonCard>
      <div class="text-body-xs my-2">
        Are you sure you want to remove this user from
        <span class="font-medium">{{ projectToRemove?.name }}</span>
        ?
      </div>
    </LayoutDialog>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { StreamRoles } from '@speckle/shared'
import { useUpdateUserRole } from '~~/lib/projects/composables/projectManagement'
import { useDebouncedTextInput, type LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsWorkspacesMembersActionsMenu_UserFragment } from '~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'
import { ArrowUpRight } from 'lucide-vue-next'

graphql(`
  fragment SettingsWorkspacesMembersActionsProjectPermissionsDialog_User on WorkspaceCollaborator {
    projectRoles {
      project {
        id
        name
      }
      role
    }
  }
`)

const props = defineProps<{
  user?: SettingsWorkspacesMembersActionsMenu_UserFragment
  workspaceId: string
}>()

const open = defineModel<boolean>('open', { required: true })

const loading = ref(false)
const showRemoveUserFromProjectConfirmationDialog = ref(false)
const projectToRemove = ref<{ id: string; name: string } | null>(null)
const searchTerm = ref('')

const { on: searchOn, bind: searchBind } = useDebouncedTextInput({
  model: searchTerm,
  debouncedBy: 300
})

const project = computed(() => ({ workspaceId: props.workspaceId }))

const filteredProjectRoles = computed(() => {
  const roles = props.user?.projectRoles
  if (!searchTerm.value) return roles || []
  return (roles || []).filter((projectRole) =>
    projectRole.project.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const updateRole = useUpdateUserRole(project)

const updateProjectRole = async (projectId: string, newRole: StreamRoles | null) => {
  if (!props.user) return

  loading.value = true
  await updateRole({
    projectId,
    userId: props.user.id,
    role: newRole
  })
  loading.value = false
}

const projectCount = computed(() => props.user?.projectRoles?.length)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      showRemoveUserFromProjectConfirmationDialog.value = false
      projectToRemove.value = null
    }
  },
  {
    text: 'Confirm',
    onClick: () => {
      if (projectToRemove.value?.id) {
        updateProjectRole(projectToRemove.value.id, null)
        if (projectCount.value === 0) {
          open.value = false
        }
        showRemoveUserFromProjectConfirmationDialog.value = false
        projectToRemove.value = null
      }
    }
  }
])
</script>

<template>
  <LayoutDialog v-model:open="open" max-width="sm">
    <template #header>Change project permissions</template>
    <div class="text-foreground mb-8">
      <div v-if="projectCount > 0" class="flex flex-col gap-4">
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
        <div
          class="flex flex-col divide-y divide-outline-3 rounded-md border border-outline-3"
        >
          <div
            v-for="projectRole in filteredProjectRoles"
            :key="projectRole.project.id"
            class="flex items-center justify-between p-4"
          >
            <span class="text-body-sm">{{ projectRole.project.name }}</span>
            <ProjectPageTeamPermissionSelect
              :model-value="projectRole.role"
              :disabled="false"
              mount-menu-on-body
              hide-owner
              @update:model-value="
                (newRole) => updateProjectRole(projectRole.project.id, newRole)
              "
              @delete="() => updateProjectRole(projectRole.project.id, null)"
            />
          </div>
        </div>
      </div>
      <div v-else>
        This guest doesn't have access to any projects in this workspace.
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { StreamRoles } from '@speckle/shared'
import { useUpdateUserRole } from '~~/lib/projects/composables/projectManagement'
import type { WorkspaceCollaborator } from '~/lib/common/generated/gql/graphql'
import { useDebouncedTextInput } from '@speckle/ui-components'

const props = defineProps<{
  user: WorkspaceCollaborator
  workspaceId: string
}>()

const open = defineModel<boolean>('open', { required: true })

const loading = ref(false)
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
</script>

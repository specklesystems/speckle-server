<template>
  <div>
    <ProjectPageSettingsBlock v-if="canLeaveProject" background title="Leave project">
      <p>
        Remove yourself from this project. To join again you will need to get invited.
      </p>
      <template #bottom-buttons>
        <FormButton color="danger" @click="showLeaveDialog = true">
          Leave project
        </FormButton>
      </template>
    </ProjectPageSettingsBlock>
    <ProjectPageSettingsGeneralBlockLeaveDialog
      v-if="canLeaveProject"
      v-model:open="showLeaveDialog"
      :project="project"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsGeneralBlockLeave_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { Roles } from '@speckle/shared'

graphql(`
  fragment ProjectPageSettingsGeneralBlockLeave_Project on Project {
    id
    name
    role
    team {
      role
      user {
        ...LimitedUserAvatar
        role
      }
    }
    workspace {
      id
    }
  }
`)

const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockLeave_ProjectFragment
}>()

const showLeaveDialog = ref(false)

const { activeUser } = useActiveUser()

const canLeaveProject = computed(() => {
  if (!activeUser.value || !props.project.role) {
    return false
  }

  const userId = activeUser.value.id
  const owners = props.project.team.filter((t) => t.role === Roles.Stream.Owner)
  return owners.length !== 1 || owners[0].user.id !== userId
})
</script>

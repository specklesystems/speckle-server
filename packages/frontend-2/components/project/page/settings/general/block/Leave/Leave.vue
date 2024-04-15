<template>
  <div>
    <ProjectPageSettingsBlock
      v-if="canLeaveProject"
      background
      title="Leave Project"
      :icon="ArrowRightOnRectangleIcon"
    >
      <template #introduction>
        <p class="font-bold mb-2 text-sm">
          Removing yourself from the collaborators list is an irreversible action.
        </p>
        <p>
          If you are sure you want to proceed, click the button below to begin deletion.
        </p>
      </template>
      <div class="flex justify-end w-full">
        <div class="max-w-max">
          <FormButton color="danger" outlined @click="showLeaveDialog = true">
            Leave Project
          </FormButton>
        </div>
      </div>
    </ProjectPageSettingsBlock>
    <ProjectPageSettingsGeneralBlockLeaveDialog
      v-if="canLeaveProject"
      v-model:open="showLeaveDialog"
      :project="project"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
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

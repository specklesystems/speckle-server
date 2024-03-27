<template>
  <ProjectPageSettingsBlock title="Collaborators">
    <template #logo><UsersIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>Invite new members or edit roles for existing ones.</p>
    </template>
    <template #topButtons>
      <FormButton :icon-left="UserPlusIcon" @click="toggleInviteDialog">
        Invite
      </FormButton>
    </template>
    <!-- <ProjectPageTeamDialogManageUsers :project="project" /> -->

    <ProjectPageSettingsCollaboratorsInviteDialog v-model:open="showInviteDialog" />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import { UsersIcon, UserPlusIcon } from '@heroicons/vue/24/outline'

const showInviteDialog = ref(false)

const toggleInviteDialog = () => {
  showInviteDialog.value = true
}
</script>

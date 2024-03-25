<template>
  <ProjectPageSettingsBlock title="Discussions">
    <template #logo><ChatBubbleLeftRightIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>Control who can leave comments on your projects:</p>
    </template>
    <FormRadioGroup v-model="selectedOption" :options="radioOptions" />
  </ProjectPageSettingsBlock>
</template>
<script setup lang="ts">
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'

const selectedOption = ref('anyone')

const radioOptions = [
  { value: 'anyone', title: 'Anyone', icon: UserGroupIcon },
  {
    value: 'teamMembers',
    title: 'Team Members Only',
    icon: UserCircleIcon,
    help: 'When the Project Access is “Private” only team members can comment.'
  }
]
</script>

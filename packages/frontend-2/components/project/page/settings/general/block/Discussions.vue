<template>
  <ProjectPageSettingsBlock background title="Discussions">
    <template #logo><ChatBubbleLeftRightIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>Control who can leave comments on your projects:</p>
    </template>
    <FormRadioGroup
      v-model="selectedOption"
      :options="radioOptions"
      @update:model-value="emitUpdate"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'

const props = defineProps<{
  currentCommentsPermission?: boolean
}>()

const emit = defineEmits(['update-comments-permission'])

const selectedOption = ref(props.currentCommentsPermission ? 'anyone' : 'teamMembers')

const radioOptions = [
  { value: 'anyone', title: 'Anyone', icon: UserGroupIcon },
  {
    value: 'teamMembers',
    title: 'Team Members Only',
    icon: UserCircleIcon,
    help: 'When the Project Access is “Private” only team members can comment.'
  }
]

const emitUpdate = (value: string) => {
  emit('update-comments-permission', value === 'anyone')
}
</script>

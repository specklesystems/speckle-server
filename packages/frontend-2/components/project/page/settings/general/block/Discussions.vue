<template>
  <ProjectPageSettingsBlock
    background
    title="Discussions"
    :icon="ChatBubbleLeftRightIcon"
  >
    <template #introduction>
      <p>Control who can leave comments on your projects:</p>
    </template>
    <FormRadioGroup
      v-model="selectedOption"
      :disabled="currentVisibility === ProjectVisibility.Private"
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
import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  currentCommentsPermission?: boolean
  currentVisibility?: ProjectVisibility
}>()

const emit = defineEmits(['update-comments-permission'])

const selectedOption = ref(props.currentCommentsPermission ? 'anyone' : 'teamMembers')

const radioOptions = computed(() => [
  { value: 'anyone', title: 'Anyone', icon: UserGroupIcon },
  {
    value: 'teamMembers',
    title: 'Team Members Only',
    icon: UserCircleIcon,
    help:
      props.currentVisibility === ProjectVisibility.Private
        ? 'When the Project Access is “Private” only team members can comment.'
        : undefined
  }
])

watch(
  () => props.currentVisibility,
  (newVisibility) => {
    if (newVisibility === ProjectVisibility.Private) {
      selectedOption.value = 'teamMembers'
    }
  },
  { immediate: true }
)

const emitUpdate = (value: string) => {
  emit('update-comments-permission', value === 'anyone')
}
</script>

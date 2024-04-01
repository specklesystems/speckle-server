<template>
  <ProjectPageSettingsBlock background title="Access">
    <template #logo><LockClosedIcon class="h-5 w-5" /></template>
    <template #introduction>
      <p>
        Choose how you want to share your projects with others. Select the option that
        best suits your needs:
      </p>
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
  LockClosedIcon,
  UserGroupIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'
import { FormRadioGroup } from '@speckle/ui-components'
import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  currentVisibility?: ProjectVisibility
}>()

const emit = defineEmits(['update-visibility'])

const selectedOption = computed({
  get: () => props.currentVisibility ?? ProjectVisibility.Private, // Default to Private if undefined
  set: (value) => {
    const visibility = value as ProjectVisibility
    emit('update-visibility', visibility)
  }
})

const radioOptions = [
  {
    value: ProjectVisibility.Public,
    title: 'Public',
    introduction: 'Anyone can view and access your project',
    icon: UserGroupIcon
  },
  {
    value: ProjectVisibility.Unlisted,
    title: 'Unlisted',
    introduction: 'Anyone with the link can access',
    icon: UserCircleIcon
  },
  {
    value: ProjectVisibility.Private,
    title: 'Private',
    introduction: 'Only team members will have access',
    icon: UserCircleIcon
  }
]

const emitUpdate = () => {
  emit('update-visibility', selectedOption.value)
}
</script>

<template>
  <ProjectPageSettingsBlock background title="Project Info">
    <template #logo><Cog6ToothIcon class="h-5 w-5" /></template>
    <FormTextInput
      v-model="localProjectName"
      name="projectName"
      label="Project Name"
      placeholder="Project Name"
      show-label
      color="foundation"
    />
    <FormTextArea
      v-model="localProjectDescription"
      name="projectDescription"
      label="Project Description"
      placeholder="Project Description"
      show-label
      color="foundation"
    />
    <template #bottomButtons>
      <FormButton text :disabled="!hasChanges" @click="resetLocalState">
        Cancel
      </FormButton>
      <FormButton :disabled="!hasChanges" @click="emitUpdate">Update</FormButton>
    </template>
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { defineProps, defineEmits } from 'vue'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  projectName: string
  projectDescription?: Nullable<string>
}>()

const emit = defineEmits(['update-project'])

const localProjectName = ref(props.projectName)
const localProjectDescription = ref(props.projectDescription ?? '')

const hasChanges = computed(() => {
  return (
    localProjectName.value !== props.projectName ||
    localProjectDescription.value !== props.projectDescription
  )
})

const emitUpdate = () => {
  emit('update-project', {
    name: localProjectName.value,
    description: localProjectDescription.value
  })
}

const resetLocalState = () => {
  localProjectName.value = props.projectName
  localProjectDescription.value = props.projectDescription ?? ''
}
</script>

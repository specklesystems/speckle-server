<template>
  <div class="flex flex-col gap-4">
    <ProjectPageSettingsBlock background title="Project Info" :icon="Cog6ToothIcon">
      <FormTextInput
        v-model="localProjectName"
        name="projectName"
        label="Project Name"
        placeholder="Project Name"
        show-label
        color="foundation"
        class="mb-4"
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

    <LayoutDialog
      v-model:open="showConfirmDialog"
      max-width="md"
      :buttons="dialogButtons"
    >
      <template #header>Unsaved Changes</template>
      <div class="space-y-4">
        <p>You have unsaved changes. Do you want to save them before leaving?</p>
      </div>
    </LayoutDialog>
  </div>
</template>

<script setup lang="ts">
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import {
  FormTextInput,
  FormTextArea,
  FormButton,
  LayoutDialog
} from '@speckle/ui-components'
import type { ProjectSettingsQuery } from '~~/lib/common/generated/gql/graphql'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  project: ProjectSettingsQuery['project']
}>()

const emit = defineEmits(['update-project'])
const router = useRouter()

const targetRoute = ref<RouteLocationRaw | undefined>(undefined)
const localProjectName = ref(props.project.name)
const localProjectDescription = ref(props.project.description ?? '')
const showConfirmDialog = ref(false)

const hasChanges = computed(() => {
  return (
    localProjectName.value !== props.project.name ||
    localProjectDescription.value !== props.project.description
  )
})

const emitUpdate = () => {
  emit('update-project', {
    name: localProjectName.value,
    description: localProjectDescription.value
  })
  if (targetRoute.value) {
    router.push(targetRoute.value)
  }
}

const resetLocalState = () => {
  localProjectName.value = props.project.name
  localProjectDescription.value = props.project.description ?? ''
  showConfirmDialog.value = false
}

const dialogButtons = computed(() => [
  {
    text: 'Discard Changes',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      showConfirmDialog.value = false
      resetLocalState()
      if (targetRoute.value) {
        router.push(targetRoute.value)
      }
    }
  },
  {
    text: 'Save Changes',
    props: {
      fullWidth: true,
      outline: true,
      submit: true
    },
    onClick: () => {
      showConfirmDialog.value = false
      emitUpdate()
    }
  }
])

onBeforeRouteLeave((to, from, next) => {
  if (hasChanges.value && !showConfirmDialog.value) {
    targetRoute.value = to
    showConfirmDialog.value = true
    next(false)
  } else {
    next()
  }
})
</script>

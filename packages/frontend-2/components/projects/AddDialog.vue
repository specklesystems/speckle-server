<template>
  <LayoutDialog v-model:open="open" max-width="sm" :title="step.title">
    <ProjectsAddDialogWorkspace
      v-if="step.id === DialogStepId.Workspace"
      @workspace-selected="onWorkspaceSelected"
      @canceled="onCanceled"
    />
    <ProjectsAddDialogMetadata
      v-else-if="step.id === DialogStepId.Metadata"
      :workspace-id="workspaceId"
      :support-go-back="!!previousStep"
      @created="onCreated"
      @canceled="onCanceled"
      @back="goToPreviousStep"
    />
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { useMultiStepDialog } from '~/lib/common/composables/dialog'

const DialogStepId = {
  Workspace: 'workspace',
  Metadata: 'metadata'
} as const
type DialogStepId = (typeof DialogStepId)[keyof typeof DialogStepId]

const emit = defineEmits<{
  (e: 'created', project: { id: string }): void
}>()

const props = defineProps<{
  workspaceId?: MaybeNullOrUndefined<string>
}>()

const workspaceId = ref(props.workspaceId)
const open = defineModel<boolean>('open', { required: true })

const {
  public: { FF_PERSONAL_PROJECTS_LIMITS_ENABLED }
} = useRuntimeConfig()
const forcePickingWorkspace = computed(() => !!FF_PERSONAL_PROJECTS_LIMITS_ENABLED)

const { step, resetStep, goToNextStep, previousStep, goToPreviousStep } =
  useMultiStepDialog<DialogStepId>({
    steps: computed(() => [
      {
        id: DialogStepId.Workspace,
        title: 'Choose workspace for a new project',
        skippable: !forcePickingWorkspace.value
      },
      {
        id: DialogStepId.Metadata,
        title: 'Create a new project'
      }
    ]),
    resolveNextStep: () => {
      return forcePickingWorkspace.value && !workspaceId.value
        ? DialogStepId.Workspace
        : DialogStepId.Metadata
    },
    resolvePreviousStep: () => {
      return forcePickingWorkspace.value
        ? DialogStepId.Workspace
        : DialogStepId.Metadata
    }
  })

const onWorkspaceSelected = (workspace: { id: string }) => {
  workspaceId.value = workspace.id
  goToNextStep()
}

const onCanceled = () => {
  open.value = false
}

const onCreated = (project: { id: string }) => {
  emit('created', project)
  open.value = false
}

watch(open, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    workspaceId.value = props.workspaceId
    resetStep()
  }
})

watch(
  () => props.workspaceId,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      workspaceId.value = props.workspaceId
      resetStep()
    }
  }
)
</script>

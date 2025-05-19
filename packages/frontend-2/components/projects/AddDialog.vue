<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Create a new project</template>
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="flex flex-col gap-y-4 mb-2">
        <FormTextInput
          name="name"
          label="Project name"
          placeholder="Name"
          color="foundation"
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          auto-focus
          autocomplete="off"
          show-label
        />
        <FormTextArea
          name="description"
          label="Project description"
          placeholder="Description"
          color="foundation"
          size="lg"
          show-label
          show-optional
          :rules="[isStringOfLength({ maxLength: 65536 })]"
        />
        <div>
          <h3 class="label mb-2">Access permissions</h3>
          <ProjectVisibilitySelect
            v-model="visibility"
            mount-menu-on-body
            :workspace-id="workspaceId"
          />
        </div>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { SupportedProjectVisibility } from '~/lib/projects/helpers/visibility'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useCreateProject } from '~~/lib/projects/composables/projectManagement'

type FormValues = {
  name: string
  description?: string
}

const props = defineProps<{
  workspaceId?: string
}>()

const emit = defineEmits<{
  (e: 'created'): void
}>()

const createProject = useCreateProject()
const logger = useLogger()
const { handleSubmit, isSubmitting } = useForm<FormValues>()

const visibility = ref(
  props.workspaceId
    ? SupportedProjectVisibility.Workspace
    : SupportedProjectVisibility.Private
)
const isLoading = ref(false)

const open = defineModel<boolean>('open', { required: true })

const mp = useMixpanel()

const onSubmit = handleSubmit(async (values) => {
  if (isLoading.value) return // Prevent submission while closing

  try {
    isLoading.value = true

    await createProject({
      name: values.name,
      description: values.description,
      visibility: visibility.value,
      ...(props.workspaceId ? { workspaceId: props.workspaceId } : {})
    })
    emit('created')
    mp.track('Stream Action', {
      type: 'action',
      name: 'create',
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceId
    })
    open.value = false
  } catch (error) {
    isLoading.value = false
    logger.error('Failed to create project:', error)
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => {
  const isDisabled = isSubmitting.value || isLoading.value

  return [
    {
      text: 'Cancel',
      props: {
        color: 'outline',
        disabled: isDisabled
      },
      onClick: () => (open.value = false)
    },
    {
      text: 'Create',
      props: {
        submit: true,
        loading: isDisabled,
        disabled: isDisabled
      },
      onClick: onSubmit
    }
  ]
})

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    isLoading.value = false
    visibility.value = props.workspaceId
      ? SupportedProjectVisibility.Workspace
      : SupportedProjectVisibility.Private
  }
})
</script>

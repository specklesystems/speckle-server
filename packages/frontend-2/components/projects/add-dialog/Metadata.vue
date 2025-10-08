<template>
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
    <div class="flex justify-end gap-2 my-2">
      <FormButton
        type="button"
        color="outline"
        :disabled="isDisabled"
        @click="() => (supportGoBack ? $emit('back') : $emit('canceled'))"
      >
        {{ supportGoBack ? 'Back' : 'Cancel' }}
      </FormButton>
      <FormButton type="submit" color="primary" :loading="isDisabled">
        Create
      </FormButton>
    </div>
  </form>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
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
  supportGoBack?: boolean
  workspaceId?: MaybeNullOrUndefined<string>
}>()

const emit = defineEmits<{
  (e: 'created', project: { id: string }): void
  (e: 'canceled'): void
  (e: 'back'): void
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

const mp = useMixpanel()

const isDisabled = computed(() => isSubmitting.value || isLoading.value)

const onSubmit = handleSubmit(async (values) => {
  if (isLoading.value) return // Prevent submission while closing

  try {
    isLoading.value = true

    const newProject = await createProject({
      name: values.name,
      description: values.description,
      visibility: visibility.value,
      ...(props.workspaceId ? { workspaceId: props.workspaceId } : {})
    })

    if (newProject?.id) {
      emit('created', { id: newProject.id })
      mp.track('Stream Action', {
        type: 'action',
        name: 'create',
        // eslint-disable-next-line camelcase
        workspace_id: props.workspaceId
      })
    }
  } catch (error) {
    logger.error('Failed to create project:', error)
  } finally {
    isLoading.value = false
  }
})

watch(
  () => props.workspaceId,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      visibility.value = props.workspaceId
        ? SupportedProjectVisibility.Workspace
        : SupportedProjectVisibility.Private
    }
  }
)
</script>

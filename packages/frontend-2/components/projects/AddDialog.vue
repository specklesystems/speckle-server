<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Create new project</template>
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="flex flex-col gap-3 mb-6">
        <FormTextInput
          name="name"
          label="Project name"
          placeholder="Project name"
          color="foundation"
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          show-required
          auto-focus
          autocomplete="off"
        />
        <FormTextArea
          name="description"
          label="Project description"
          placeholder="Description (optional)"
          color="foundation"
          size="lg"
          :rules="[isStringOfLength({ maxLength: 65536 })]"
        />
      </div>
      <h3 class="label mb-3">Access permissions</h3>
      <ProjectVisibilitySelect
        v-model="visibility"
        class="sm:max-w-none w-full"
        mount-menu-on-body
      />
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useCreateProject } from '~~/lib/projects/composables/projectManagement'

type FormValues = {
  name: string
  description?: string
}

const emit = defineEmits<{
  (e: 'created'): void
}>()

const createProject = useCreateProject()
const { handleSubmit } = useForm<FormValues>()

const visibility = ref(ProjectVisibility.Unlisted)

const open = defineModel<boolean>('open', { required: true })

const mp = useMixpanel()

const onSubmit = handleSubmit(async (values) => {
  await createProject({
    ...values,
    visibility: visibility.value
  })
  emit('created')
  mp.track('Stream Action', { type: 'action', name: 'create' })
  open.value = false
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { variant: 'outline', fullWidth: true },
    onClick: () => {
      open.value = false
    }
  },
  {
    text: 'Create',
    props: {
      fullWidth: true,
      outline: true,
      submit: true
    },
    onClick: onSubmit
  }
])
</script>

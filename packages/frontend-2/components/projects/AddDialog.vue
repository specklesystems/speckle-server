<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    title="Create new project"
    :buttons="dialogButtons"
  >
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="flex flex-col space-y-3 mb-6">
        <FormTextInput
          name="name"
          label="Project name"
          placeholder="Project name"
          size="lg"
          :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
          show-required
          auto-focus
        />
        <FormTextArea
          name="description"
          label="Project description"
          placeholder="Description (optional)"
          size="lg"
          :rules="[isStringOfLength({ maxLength: 65536 })]"
        />
      </div>
      <div
        class="flex flex-col space-y-4 items-end md:flex-row md:justify-between md:items-center md:space-y-0"
      >
        <ProjectVisibilitySelect
          v-model="visibility"
          class="sm:max-w-none w-full sm:w-80"
        />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
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

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true },
    onClick: () => {
      open.value = false
    }
  },
  {
    text: 'Create',
    props: {
      color: 'primary',
      fullWidth: true,
      outline: true,
      submit: true
    },
    onClick: onSubmit
  }
])
</script>

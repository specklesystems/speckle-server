<template>
  <LayoutDialog v-model:open="open" max-width="lg">
    <form class="flex flex-col text-foreground" @submit="onSubmit">
      <div class="h4 font-bold mb-4">Create new project</div>
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
        <div class="space-x-2">
          <FormButton text color="secondary" @click="open = false">Cancel</FormButton>
          <FormButton submit>Create project</FormButton>
        </div>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { ProjectVisibility } from '~~/lib/common/generated/gql/graphql'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import { useCreateProject } from '~~/lib/projects/composables/projectManagement'

type FormValues = {
  name: string
  description?: string
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'created'): void
}>()

const props = defineProps<{
  open: boolean
}>()

const createProject = useCreateProject()
const { handleSubmit } = useForm<FormValues>()

const visibility = ref(ProjectVisibility.Unlisted)

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onSubmit = handleSubmit(async (values) => {
  await createProject({
    ...values,
    visibility: visibility.value
  })
  emit('created')
  open.value = false
})
</script>

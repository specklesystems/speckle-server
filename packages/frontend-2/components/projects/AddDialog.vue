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
      <div class="flex justify-between">
        <div>TODO: Visibility switcher</div>
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
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

type FormValues = {
  name: string
  description?: string
}

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
}>()

const { handleSubmit } = useForm<FormValues>()

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const onSubmit = handleSubmit((values) => {
  console.log(values)
})
</script>

<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="md"
    @fully-closed="$emit('fully-closed')"
  >
    <form class="flex flex-col text-foreground space-y-4" @submit="onSubmit">
      <div class="h4 font-bold">Edit version message</div>
      <FormTextInput
        v-model="message"
        name="newMessage"
        label="Version message"
        placeholder="Version message"
        show-required
        :rules="[isRequired]"
      />
      <div class="flex justify-end">
        <FormButton submit :disabled="loading">Save</FormButton>
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import { ProjectModelPageDialogDeleteVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { isRequired } from '~~/lib/common/helpers/validation'

graphql(`
  fragment ProjectModelPageDialogEditMessageVersion on Version {
    id
    message
  }
`)

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'fully-closed'): void
}>()

const props = defineProps<{
  version: Nullable<ProjectModelPageDialogDeleteVersionFragment>
  open: boolean
}>()

const { handleSubmit } = useForm<{ newMessage: string }>()

const loading = ref(false)
const message = ref('')

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

watch(
  () => props.version,
  (newVersion) => {
    message.value = newVersion?.message || ''
  }
)

const onSubmit = handleSubmit((values) => console.log(values))
</script>

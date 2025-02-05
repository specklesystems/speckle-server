<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="xs"
    :buttons="[
      {
        text: 'Cancel',
        props: { color: 'outline' },
        onClick: () => {
          isOpen = false
        }
      },
      {
        text: 'Save',
        props: { disabled: loading },
        onClick: () => {
          onSubmit()
        }
      }
    ]"
    @fully-closed="$emit('fully-closed')"
  >
    <template #header>Edit version message</template>
    <form class="flex flex-col text-foreground space-y-4 mb-2" @submit="onSubmit">
      <FormTextArea
        v-model="message"
        name="newMessage"
        label="Version message"
        placeholder="Version message"
        show-label
        color="foundation"
        :rules="[isRequired]"
        :disabled="loading"
      />
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { useForm } from 'vee-validate'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectModelPageDialogDeleteVersionFragment } from '~~/lib/common/generated/gql/graphql'
import { isRequired } from '~~/lib/common/helpers/validation'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useUpdateVersion } from '~~/lib/projects/composables/versionManagement'

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
  projectId: string
  version: Nullable<ProjectModelPageDialogDeleteVersionFragment>
  open: boolean
}>()

const { handleSubmit } = useForm<{ newMessage: string }>()
const updateVersion = useUpdateVersion()

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
  },
  { deep: true }
)
const mp = useMixpanel()
const onSubmit = handleSubmit(async ({ newMessage }) => {
  if (!props.version) return

  loading.value = true
  const success = !!(await updateVersion({
    projectId: props.projectId,
    versionId: props.version?.id,
    message: newMessage
  }))
  loading.value = false
  mp.track('Commit Action', {
    type: 'action',
    name: 'edit'
  })
  if (success) isOpen.value = false
})
</script>

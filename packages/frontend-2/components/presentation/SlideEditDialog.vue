<template>
  <LayoutDialog v-model:open="open" max-width="sm" :buttons="dialogButtons">
    <template #header>Edit slide</template>
    <form @submit="onSubmit">
      <div class="flex flex-col gap-2">
        <img
          :src="slide?.screenshot"
          :alt="slide?.name"
          class="w-full object-cover rounded-lg border border-outline-3"
        />
        <FormTextInput
          v-model="name"
          name="name"
          label="Name"
          color="foundation"
          :rules="[isRequired]"
        />
        <FormTextArea
          v-model="description"
          name="description"
          label="Description"
          color="foundation"
          placeholder="Add a description..."
        />
      </div>
    </form>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~~/lib/common/generated/gql'
import type { PresentationSlideEditDialog_SavedViewFragment } from '~/lib/common/generated/gql/graphql'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { isRequired } from '~/lib/common/helpers/validation'
import { useUpdatePresentationSlide } from '~/lib/presentations/composables/mangament'
import { useForm } from 'vee-validate'

graphql(`
  fragment PresentationSlideEditDialog_SavedView on SavedView {
    id
    projectId
    name
    description
    screenshot
  }
`)

const props = defineProps<{
  slide: MaybeNullOrUndefined<PresentationSlideEditDialog_SavedViewFragment>
}>()

const open = defineModel<boolean>('open', { required: true })

const name = ref<string>('')
const description = ref<string>('')

const { mutate: updateSlide, loading } = useUpdatePresentationSlide()
const { handleSubmit } = useForm()

const onSubmit = handleSubmit(async () => {
  if (!props.slide?.id) return

  await updateSlide({
    id: props.slide.id,
    projectId: props.slide.projectId,
    name: name.value,
    description: description.value
  })

  open.value = false
})

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => {
        open.value = false
      }
    },
    {
      text: 'Save',
      props: { loading: loading.value },
      onClick: onSubmit
    }
  ]
})

watch(
  () => open.value,
  () => {
    name.value = props.slide?.name || ''
    description.value = props.slide?.description || ''
  }
)
</script>

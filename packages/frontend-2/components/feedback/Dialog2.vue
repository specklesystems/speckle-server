<template>
  <LayoutDialog
    v-model:open="isOpen"
    title="Import users to Workspace"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="md"
  >
    <div class="flex flex-col gap-y-2">
      <!-- <p class="text-body-xs text-foreground font-medium">
        Import multiple users to your workspace via a .csv file.
      </p>
      <FormFileUploadZone
        ref="uploadZone"
        v-slot="{ isDraggingFiles, activatorOn }"
        class="cropper flex items-center justify-center my-2"
        accept="image/*"
        :size-limit="5 * 1024 * 1024"
      >
        <div
          class="cursor-pointer text-center w-full h-full border-dashed border-2 rounded-md p-4 flex items-center justify-center text-sm text-foreground-2"
          v-on="activatorOn"
        >
          Click here or drag and drop a .csv file
        </div>
      </FormFileUploadZone> -->

      <FormSelectWorkspaceRoles
        v-model="workspaceRole"
        show-label
        label="Workspace role"
        size="lg"
        :allow-unset="false"
      />
      <p class="text-body-xs text-foreground font-medium mt-4">
        We've found the following users in your .csv file, select the ones you want to
        invite.
      </p>
      <div>
        <div
          v-for="field in fields"
          :key="field.key"
          class="flex my-2 w-full items-center"
        >
          <FormCheckbox hide-label name="newsletter" disabled />
          <FormTextInput
            v-model="field.value"
            :name="`email-${field.key}`"
            color="foundation"
            size="lg"
            placeholder="Email address"
            disabled
            full-width
            use-label-in-errors
            label="Email"
            readonly
          />
          <ExclamationCircleIcon
            v-tippy="'This user doesnt match the domain policy'"
            class="h-5 cursor-pointer w-5 text-danger ml-2"
            ml-2
          />
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useForm, useFieldArray } from 'vee-validate'
import { type WorkspaceRoles, Roles } from '@speckle/shared'
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

interface InviteForm {
  fields: string[]
}

const isOpen = defineModel<boolean>('open', { required: true })

const { handleSubmit } = useForm<InviteForm>({
  initialValues: {
    fields: ['niffo1@gmail.com', 'niffo2@gmail.com', 'niffo3@gmail.com']
  }
})
const { fields } = useFieldArray<string>('fields')

const workspaceRole = ref<WorkspaceRoles>(Roles.Workspace.Member)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Back',
    props: { color: 'outline' },
    submit: true
  },
  {
    text: 'Invite',
    props: { color: 'primary' },
    submit: true,
    id: 'sendFeedback'
  }
])

const onSubmit = handleSubmit(async () => {})
</script>

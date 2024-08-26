<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    hide-closer
    :buttons="dialogButtons"
    title="Create workspace"
  >
    <div class="flex flex-col gap-4 w-full">
      <FormTextInput
        v-model:model-value="workspaceName"
        name="name"
        label="Name"
        placeholder="Workspace name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        show-label
        show-required
      />
      <FormTextInput
        v-model:model-value="workspaceDescription"
        name="description"
        label="Description"
        placeholder="Workspace description"
        :rules="[isStringOfLength({ maxLength: 512 })]"
        color="foundation"
        show-label
      />
      <UserAvatarEditable
        v-model:edit-mode="editAvatarMode"
        :model-value="workspaceLogo"
        :placeholder="workspaceName"
        :default-img="defaultAvatar"
        name="edit-avatar"
        size="xxl"
        @save="editAvatarMode = false"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

type FormValues = { name: string; description: string }

const props = defineProps<{
  navigateOnSuccess?: boolean
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const createWorkspace = useCreateWorkspace()
const { generateDefaultLogoIndex, getDefaultAvatar } = useWorkspacesAvatar()
const { handleSubmit } = useForm<FormValues>()

const workspaceName = ref<string>('')
const workspaceDescription = ref<string>('')
const editAvatarMode = ref(false)
const workspaceLogo = ref<string | null>(null)
const defaultLogoIndex = ref<number>()

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline', fullWidth: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Create',
    props: {
      fullWidth: true,
      color: 'primary'
    },
    onClick: handleCreateWorkspace
  }
])
const defaultAvatar = computed(() => getDefaultAvatar(defaultLogoIndex.value))

const handleCreateWorkspace = handleSubmit(async () => {
  const newWorkspace = await createWorkspace(
    {
      name: workspaceName.value,
      description: workspaceDescription.value,
      defaultLogoIndex: defaultLogoIndex.value,
      logo: workspaceLogo.value
    },
    {
      navigateOnSuccess: props.navigateOnSuccess === true
    }
  )

  if (newWorkspace) {
    isOpen.value = false
  }
})

watch(isOpen, (newVal) => {
  if (newVal) {
    defaultLogoIndex.value = generateDefaultLogoIndex()
  }
})
</script>

<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="sm"
    :buttons="dialogButtons"
    title="Create a new workspace"
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
      />
      <FormTextInput
        v-model:model-value="workspaceDescription"
        name="description"
        label="Workspace description"
        placeholder="Workspace description"
        :rules="[isStringOfLength({ maxLength: 512 })]"
        color="foundation"
        show-label
        show-optional
      />
      <UserAvatarEditable
        v-model:edit-mode="editAvatarMode"
        :model-value="workspaceLogo"
        :placeholder="workspaceName"
        :default-img="defaultAvatar"
        name="edit-avatar"
        size="xxl"
        @save="onLogoSave"
      />
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useCreateWorkspace } from '~/lib/workspaces/composables/management'
import { useWorkspacesAvatar } from '~/lib/workspaces/composables/avatar'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'

const emit = defineEmits<(e: 'created') => void>()

type FormValues = { name: string; description: string }

const props = defineProps<{
  navigateOnSuccess?: boolean
  // Used to send to Mixpanel to know where the modal was triggered from
  eventSource: string
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const createWorkspace = useCreateWorkspace()
const { generateDefaultLogoIndex, getDefaultAvatar } = useWorkspacesAvatar()
const { handleSubmit } = useForm<FormValues>()

const workspaceName = ref<string>('')
const workspaceDescription = ref<string>('')
const editAvatarMode = ref(false)
const workspaceLogo = ref<MaybeNullOrUndefined<string>>()
const defaultLogoIndex = ref<number>(0)

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Create',
    props: {
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
    },
    {
      source: props.eventSource
    }
  )

  if (newWorkspace) {
    emit('created')
    isOpen.value = false
  }
})

const onLogoSave = (newVal: MaybeNullOrUndefined<string>) => {
  workspaceLogo.value = newVal
  editAvatarMode.value = false
}

const reset = () => {
  defaultLogoIndex.value = generateDefaultLogoIndex()
  workspaceName.value = ''
  workspaceDescription.value = ''
  workspaceLogo.value = null
}

watch(isOpen, (newVal) => {
  if (newVal) {
    reset()
  }
})
</script>

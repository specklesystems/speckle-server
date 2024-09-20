<template>
  <LayoutDialog
    v-model:open="isOpen"
    max-width="xs"
    :buttons="dialogButtons"
    title="Create a new workspace"
  >
    <div class="flex flex-col gap-4 w-full">
      <FormTextInput
        v-model:model-value="workspaceName"
        name="name"
        label="Workspace name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
        show-label
        auto-focus
        @update:model-value="updateShortId"
      />
      <FormTextInput
        v-model:model-value="workspaceShortId"
        name="shortId"
        label="Short ID"
        :help="getShortIdHelp"
        color="foundation"
        :rules="[
          isStringOfLength({ maxLength: 50, minLength: 3 }),
          isValidWorkspaceSlug
        ]"
        show-label
        @update:model-value="onShortIdInput"
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
import {
  isRequired,
  isStringOfLength,
  isValidWorkspaceSlug
} from '~~/lib/common/helpers/validation'
import { generateSlugFromName } from '@speckle/shared'
import { debounce } from 'lodash'

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
const workspaceShortId = ref<string>('')
const editAvatarMode = ref(false)
const workspaceLogo = ref<MaybeNullOrUndefined<string>>()
const defaultLogoIndex = ref<number>(0)
const shortIdManuallyEdited = ref(false)
const customShortIdError = ref<string>('')

const baseUrl = useRuntimeConfig().public.baseUrl

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
      color: 'primary',
      disabled: !workspaceName.value.trim() || !workspaceShortId.value.trim()
    },
    onClick: handleCreateWorkspace
  }
])
const defaultAvatar = computed(() => getDefaultAvatar(defaultLogoIndex.value))

const getShortIdHelp = computed(() => {
  if (!workspaceShortId.value) {
    return `Used after ${baseUrl}/workspaces/`
  }
  return `${baseUrl}/workspaces/${workspaceShortId.value}`
})

const handleCreateWorkspace = handleSubmit(async () => {
  const newWorkspace = await createWorkspace(
    {
      name: workspaceName.value,
      slug: workspaceShortId.value,
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
  workspaceShortId.value = ''
  workspaceLogo.value = null
  editAvatarMode.value = false
  shortIdManuallyEdited.value = false
}

const debouncedUpdateShortId = debounce((newName: string) => {
  if (!shortIdManuallyEdited.value) {
    const generatedSlug = generateSlugFromName({ name: newName })
    workspaceShortId.value = generatedSlug
    const validationResult = isValidWorkspaceSlug(generatedSlug)
    customShortIdError.value =
      typeof validationResult === 'string' ? validationResult : ''
  }
}, 300)

const updateShortId = (newName: string) => {
  debouncedUpdateShortId(newName)
}

const onShortIdInput = (newValue: string) => {
  shortIdManuallyEdited.value = true
  const validationResult = isValidWorkspaceSlug(newValue)
  customShortIdError.value =
    typeof validationResult === 'string' ? validationResult : ''
}

watch(isOpen, (newVal) => {
  if (newVal) {
    reset()
  }
})
</script>

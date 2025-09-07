<template>
  <aside class="bg-foundation h-screen w-80 border-l border-outline-3 py-5 px-4">
    <section class="pt-2 flex flex-col gap-0">
      <div v-if="title || isEditingTitle" class="relative">
        <FormTextInput
          ref="titleInputRef"
          v-model="editedTitle"
          color="foundation"
          size="lg"
          name="Title"
          placeholder="Enter title"
          :input-classes="
            !isEditingTitle
              ? '!border-none !bg-transparent !text-xl !font-medium !px-2 !text-[1.25rem]'
              : '!text-xl !font-medium !px-2 !text-[1.25rem]'
          "
          :rules="[isStringOfLength({ maxLength: 255 })]"
          validate-on-value-update
          @click="!isEditingTitle && startEditTitle()"
          @keyup.enter="saveTitle"
          @keyup.esc="cancelEditTitle"
          @blur="saveTitle"
        />
      </div>

      <div class="relative">
        <FormTextArea
          ref="descriptionInputRef"
          v-model="editedDescription"
          color="foundation"
          name="Description"
          placeholder="Enter description"
          :textarea-classes="
            !isEditingDescription
              ? '!border-transparent !text-body-sm !resize-none !min-h-0'
              : 'text-body-sm !resize-none !min-h-0'
          "
          :rules="[isStringOfLength({ maxLength: 1000 })]"
          validate-on-value-update
          @click="!isEditingDescription && startEditDescription()"
          @keydown.enter="handleEnterKey"
          @keyup.esc="cancelEditDescription"
        />
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { isStringOfLength } from '~~/lib/common/helpers/validation'
import { useUpdateSavedView } from '~/lib/viewer/composables/savedViews/management'
import type { MaybeNullOrUndefined } from '@speckle/shared'

const props = defineProps<{
  title: MaybeNullOrUndefined<string>
  description: MaybeNullOrUndefined<string>
  viewId?: MaybeNullOrUndefined<string>
  projectId?: MaybeNullOrUndefined<string>
}>()

const updateSavedView = useUpdateSavedView()

const isEditingTitle = ref(false)
const editedTitle = ref(props.title || '')
const titleInputRef = ref()
const originalTitle = ref('')

const isEditingDescription = ref(false)
const editedDescription = ref(props.description || '')
const descriptionInputRef = ref()
const originalDescription = ref('')

const autoResizeTextarea = () => {
  nextTick(() => {
    const textarea = descriptionInputRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      textarea.style.setProperty('height', 'auto', 'important')
      textarea.style.setProperty(
        'height',
        textarea.scrollHeight + 2 + 'px',
        'important'
      )
    }
  })
}

const startEditTitle = () => {
  editedTitle.value = props.title || ''
  originalTitle.value = props.title || ''
  isEditingTitle.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
  })
}

const cancelEditTitle = () => {
  isEditingTitle.value = false
  editedTitle.value = originalTitle.value
}

const saveTitle = async () => {
  if (!props.viewId || !props.projectId) {
    isEditingTitle.value = false
    return
  }

  if (editedTitle.value === originalTitle.value) {
    isEditingTitle.value = false
    return
  }

  const result = await updateSavedView(
    {
      view: {
        id: props.viewId,
        projectId: props.projectId,
        isHomeView: false,
        groupResourceIds: [],
        group: { id: '' }
      },
      input: {
        id: props.viewId,
        projectId: props.projectId,
        name: editedTitle.value
      }
    },
    { skipToast: true }
  )

  if (result?.id) {
    isEditingTitle.value = false
  }
}

const startEditDescription = () => {
  editedDescription.value = props.description || ''
  originalDescription.value = props.description || ''
  isEditingDescription.value = true

  nextTick(() => {
    descriptionInputRef.value?.focus()
    autoResizeTextarea()
  })
}

const cancelEditDescription = () => {
  isEditingDescription.value = false
  editedDescription.value = ''
  originalDescription.value = ''
  autoResizeTextarea()
}

const handleEnterKey = (event: KeyboardEvent) => {
  event.preventDefault()
  saveDescription()
}

const saveDescription = async () => {
  if (!props.viewId || !props.projectId) {
    isEditingDescription.value = false
    return
  }

  if (editedDescription.value === originalDescription.value) {
    isEditingDescription.value = false
    return
  }

  const result = await updateSavedView(
    {
      view: {
        id: props.viewId,
        projectId: props.projectId,
        isHomeView: false,
        groupResourceIds: [],
        group: { id: '' }
      },
      input: {
        id: props.viewId,
        projectId: props.projectId,
        description: editedDescription.value
      }
    },
    { skipToast: true }
  )

  if (result?.id) {
    isEditingDescription.value = false
    autoResizeTextarea()
  }
}

watch(
  () => props.title,
  (newTitle) => {
    if (!isEditingTitle.value) {
      editedTitle.value = newTitle || ''
    }
  }
)

watch(
  () => props.description,
  (newDescription) => {
    if (!isEditingDescription.value) {
      editedDescription.value = newDescription || ''
      autoResizeTextarea()
    }
  }
)

watch(editedDescription, () => {
  autoResizeTextarea()
})

onMounted(() => {
  autoResizeTextarea()
})
</script>

<template>
  <div class="flex flex-col items-center space-y-2">
    <LazyUserAvatarEditor
      v-if="editMode"
      :user="modelAsUser"
      :disabled="disabled"
      @cancel="editMode = false"
      @save="onSave"
    />
    <div v-else class="relative group">
      <UserAvatar :user="modelAsUser" size="editable" />
      <div
        class="opacity-0 transition-all absolute group-hover:opacity-100 inset-0 flex items-end justify-center bottom-4"
      >
        <FormButton :disabled="disabled" color="secondary" @click="editMode = true">
          Change
        </FormButton>
      </div>
    </div>
    <div v-if="errorMessage" class="w-full text-center text-danger text-sm">
      {{ errorMessage }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { computed, defineAsyncComponent } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import { AvatarUser } from '~~/src/composables/user/avatar'
import CommonLoadingIcon from '~~/src/components/common/loading/Icon.vue'
import { RuleExpression, useField } from 'vee-validate'

type ModelType = MaybeNullOrUndefined<string>

const LazyUserAvatarEditor = defineAsyncComponent({
  loader: () => import('~~/src/components/user/AvatarEditor.vue'),
  loadingComponent: CommonLoadingIcon,
  delay: 100
})

const emit = defineEmits<{
  (e: 'save', newUrl: ModelType): void
  (e: 'update:modelValue', value: ModelType): void
}>()

const props = defineProps<{
  modelValue: ModelType
  /**
   * Placeholder name that will be used to generate and show initials if no avatar is present
   */
  placeholder: string
  /**
   * Name of the field. Used for validation & form submits
   */
  name: string
  rules?: RuleExpression<ModelType>
  validateOnMount?: boolean
  validateOnValueUpdate?: boolean
  disabled?: boolean
}>()

const { value, errorMessage } = useField<ModelType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  validateOnValueUpdate: props.validateOnValueUpdate,
  initialValue: props.modelValue || undefined
})

const editMode = defineModel<boolean>('editMode', { local: true })

const modelAsUser = computed(
  (): AvatarUser => ({
    avatar: value.value,
    name: props.placeholder
  })
)

const onSave = (newUrl: Nullable<string>) => {
  value.value = newUrl
  emit('save', newUrl)
}

const open = () => (editMode.value = true)
const close = () => (editMode.value = false)

defineExpose({ open, close })
</script>

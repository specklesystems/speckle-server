<template>
  <div class="flex flex-col items-center space-y-2">
    <LazyUserAvatarEditor
      v-if="editMode"
      :user="modelAsUser"
      :disabled="disabled"
      :size="size"
      @cancel="editMode = false"
      @save="onSave"
    />
    <div v-else class="relative group">
      <img
        v-if="!modelAsUser.avatar && defaultImg"
        :src="defaultImg"
        :alt="modelAsUser.name"
        :class="sizeClasses"
      />
      <UserAvatar v-else :user="modelAsUser" :size="size" />
      <div
        class="opacity-0 transition-all absolute group-hover:opacity-100 top-0 right-0 left-0 bottom-0 flex items-end justify-center bottom-4"
      >
        <FormButton
          size="sm"
          :disabled="disabled"
          color="outline"
          @click="editMode = true"
        >
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
import type { MaybeNullOrUndefined, Nullable } from '@speckle/shared'
import { computed, defineAsyncComponent, toRefs } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import type { AvatarUser, UserAvatarSize } from '~~/src/composables/user/avatar'
import CommonLoadingIcon from '~~/src/components/common/loading/Icon.vue'
import { useField } from 'vee-validate'
import type { RuleExpression } from 'vee-validate'
import { useAvatarSizeClasses } from '~~/src/composables/user/avatar'

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
  modelValue?: ModelType
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
  size?: UserAvatarSize
  defaultImg?: string
}>()

const { value, errorMessage } = useField<ModelType>(props.name, props.rules, {
  validateOnMount: props.validateOnMount,
  validateOnValueUpdate: props.validateOnValueUpdate,
  initialValue: props.modelValue || undefined
})
const { sizeClasses } = useAvatarSizeClasses({ props: toRefs(props) })

// 'local' was recently removed, but we still want to keep backwards compatibility w/ older vue versions, so have to use this workaround
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
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

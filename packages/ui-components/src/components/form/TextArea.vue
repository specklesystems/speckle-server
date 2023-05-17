<template>
  <div :class="[fullWidth ? 'w-full' : '']">
    <label :for="name" :class="labelClasses">
      <span>{{ title }}</span>
    </label>
    <div class="relative">
      <textarea
        :id="name"
        ref="inputElement"
        v-model="value"
        :name="name"
        :class="[coreClasses, iconClasses, 'min-h-[4rem]']"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-invalid="errorMessage ? 'true' : 'false'"
        :aria-describedby="helpTipId"
        v-bind="$attrs"
        @change="$emit('change', { event: $event, value })"
        @input="$emit('input', { event: $event, value })"
      />
      <a
        v-if="showClear"
        title="Clear input"
        class="absolute top-2 right-0 flex items-center pr-2 cursor-pointer"
        @click="clear"
        @keydown="clear"
      >
        <span class="text-xs sr-only">Clear input</span>
        <XMarkIcon class="h-5 w-5 text-foreground" aria-hidden="true" />
      </a>
      <div
        v-if="errorMessage"
        :class="[
          'pointer-events-none absolute inset-y-0 right-0 flex items-center',
          showClear ? 'pr-8' : 'pr-2'
        ]"
      >
        <ExclamationCircleIcon class="h-4 w-4 text-danger" aria-hidden="true" />
      </div>
      <div
        v-if="showRequired && !errorMessage"
        class="pointer-events-none absolute inset-y-0 mt-3 text-4xl right-0 flex items-center pr-2 text-danger opacity-50"
      >
        *
      </div>
    </div>
    <p v-if="helpTipId" :id="helpTipId" :class="helpTipClasses">
      {{ helpTip }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { Nullable } from '@speckle/shared'
import { RuleExpression } from 'vee-validate'
import { computed, ref, toRefs } from 'vue'
import { InputColor, useTextInputCore } from '~~/src/composables/form/textInput'

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: { event?: Event; value: string }): void
  (e: 'input', val: { event?: Event; value: string }): void
  (e: 'clear'): void
}>()

const props = withDefaults(
  defineProps<{
    /**
     * Unique ID for the input (must be unique page-wide)
     */
    name: string
    showLabel?: boolean
    help?: string
    placeholder?: string
    label?: string
    disabled?: boolean
    rules?: RuleExpression<string>
    validateOnMount?: boolean
    validateOnValueUpdate?: boolean
    useLabelInErrors?: boolean
    autoFocus?: boolean
    modelValue?: string
    showClear?: boolean
    fullWidth?: boolean
    showRequired?: boolean
    color?: InputColor
  }>(),
  {
    useLabelInErrors: true,
    modelValue: '',
    color: 'page'
  }
)

const inputElement = ref(null as Nullable<HTMLTextAreaElement>)

const {
  coreClasses,
  title,
  value,
  helpTipId,
  helpTipClasses,
  helpTip,
  errorMessage,
  labelClasses,
  clear,
  focus
} = useTextInputCore({
  props: toRefs(props),
  emit,
  inputEl: inputElement
})

const iconClasses = computed(() => {
  const classParts: string[] = ['pl-2']

  if (props.showClear && errorMessage.value) {
    classParts.push('pr-12')
  } else if (props.showClear || errorMessage.value) {
    classParts.push('pr-8')
  }

  return classParts.join(' ')
})

defineExpose({ focus })
</script>

<template>
  <FormSelectBase
    :model-value="modelValue"
    :name="fieldName"
    :rules="validator"
    :label="control.label"
    :items="control.options"
    :multiple="multiple"
    :help="control.description"
    :disabled="!control.enabled"
    :show-required="isRequired"
    show-label
    by="value"
    button-style="tinted"
    :validate-on-value-update="validateOnValueUpdate"
    @update:model-value="handleChange"
  >
    <template #nothing-selected>
      {{
        appliedOptions['placeholder']
          ? appliedOptions['placeholder']
          : multiple
          ? 'Select values'
          : 'Select a value'
      }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item.value" class="text-foreground">
              {{ item.label + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="flex items-center">
          <span class="truncate text-foreground">
            {{ (isArrayValue(value) ? value[0] : value).label }}
          </span>
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ item.label }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { type ControlElement } from '@jsonforms/core'
import { rendererProps, useJsonFormsEnumControl } from '@jsonforms/vue'
import { type Nullable } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { useJsonRendererBaseSetup } from '~/lib/form/composables/jsonRenderers'

type OptionType = { value: string; label: string }
type ValueType = OptionType | OptionType[] | undefined

const emit = defineEmits<(e: 'update:modelValue', v: ValueType) => void>()

const props = defineProps({
  ...rendererProps<ControlElement>(),
  // TODO: Doesn't appear that jsonforms properly supports multiple selection
  multiple: {
    type: Boolean,
    default: false
  },
  controlOverrides: {
    type: Object as PropType<Nullable<ReturnType<typeof useJsonFormsEnumControl>>>,
    default: null
  }
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)

const { hiddenSelectedItemCount, isArrayValue, isMultiItemArrayValue } =
  useFormSelectChildInternals<OptionType>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const {
  handleChange,
  control,
  validator,
  appliedOptions,
  fieldName,
  validateOnValueUpdate,
  isRequired
} = useJsonRendererBaseSetup(props.controlOverrides || useJsonFormsEnumControl(props), {
  onChangeValueConverter: (newVal: ValueType) => {
    if (props.multiple && isArrayValue(newVal)) {
      return newVal.map((v) => v.value)
    } else if (newVal && !props.multiple && !isArrayValue(newVal)) {
      return newVal.value
    } else {
      return undefined
    }
  }
})

const modelValue = computed(() => {
  const val = control.value.data as string
  const res = control.value.options.find((o) => o.value === val)

  if (props.multiple) {
    return res ? [res] : []
  } else {
    return res || undefined
  }
})
</script>

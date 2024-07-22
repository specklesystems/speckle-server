<template>
  <fieldset class="flex flex-col">
    <legend class="flex items-center space-x-2">
      <div class="inline-flex space-x-1 items-center">
        <span class="font-medium text-foreground-2">{{ control.label }}</span>
        <span
          v-if="isRequired"
          class="text-2xl text-danger opacity-50 h-4 w-4 leading-6"
        >
          *
        </span>
      </div>
      <FormButton
        v-if="!isReadonly"
        hide-text
        :icon-left="PlusIcon"
        size="sm"
        :disabled="!control.enabled || (appliedOptions.restrict && maxItemsReached)"
        @click="onAdd"
      />
    </legend>
    <div v-if="control.description?.length" class="text-sm text-foreground-2">
      {{ control.description }}
    </div>
    <div class="mb-2" />
    <template v-if="noData">
      <CommonAlert color="info" size="xs">
        <template #title>
          <span class="caption">
            No data defined!
            <template v-if="!isReadonly">
              Click on the
              <strong>+</strong>
              button to add some!
            </template>
          </span>
        </template>
      </CommonAlert>
    </template>
    <template v-else>
      <div class="flex flex-col space-y-2 array-list-element-container">
        <FormJsonArrayListElement
          v-for="(_element, index) in control.data"
          :key="`${control.path}-${index}`"
          :move-up="baseControl.moveUp?.(control.path, index)"
          :move-up-enabled="control.enabled && index > 0"
          :move-down="baseControl.moveDown?.(control.path, index)"
          :move-down-enabled="control.enabled && index < control.data.length - 1"
          :delete-enabled="control.enabled && !minItemsReached"
          :do-delete="baseControl.removeItems?.(control.path, [index])"
          :label="childLabelForIndex(index)"
        >
          <DispatchRenderer
            :schema="control.schema"
            :uischema="childUiSchema"
            :path="composePaths(control.path, `${index}`)"
            :enabled="control.enabled"
            :renderers="control.renderers"
            :cells="control.cells"
          />
        </FormJsonArrayListElement>
      </div>
    </template>
    <div v-if="error" class="mt-2 text-sm text-danger">{{ error }}</div>
  </fieldset>
</template>
<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PlusIcon } from '@heroicons/vue/24/solid'
import {
  type ControlElement,
  Resolve,
  composePaths,
  createDefaultValue
} from '@jsonforms/core'
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl
} from '@jsonforms/vue'
import { useJsonRendererArrayBaseSetup } from '~/lib/form/composables/jsonRenderers'

/**
 * TODO:
 * - Render errors & other fields that others do
 * - (on entire array + separate items?)
 */

const props = defineProps({
  ...rendererProps<ControlElement>()
})

const {
  control,
  baseControl,
  childLabelForIndex,
  childUiSchema,
  appliedOptions,
  isRequired,
  error
} = useJsonRendererArrayBaseSetup(useJsonFormsArrayControl(props))

const noData = computed(() => !control.value.data || !control.value.data.length)
const isReadonly = computed(() => !control.value.enabled)
const arraySchema = computed(() =>
  Resolve.schema(props.schema, control.value.uischema.scope, control.value.rootSchema)
)

const minItemsReached = computed(() => {
  const minItems = arraySchema.value.minItems
  const data = control.value.data
  if (minItems === undefined || data === undefined) return false

  return data.length <= minItems
})

const maxItemsReached = computed(() => {
  const maxItems = arraySchema.value.maxItems
  const data = control.value.data
  if (maxItems === undefined || data === undefined) return false

  return data.length >= maxItems
})

const onAdd = () => {
  const path = control.value.path
  const val = createDefaultValue(control.value.schema, props.schema)

  const addItem = baseControl.addItem
  if (!addItem) return

  addItem(path, val)()
}
</script>
<style scoped lang="postcss">
.array-list-element-container :deep(label) {
  @apply hidden;
}
</style>

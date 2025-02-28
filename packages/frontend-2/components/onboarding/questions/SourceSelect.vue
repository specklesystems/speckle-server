<template>
  <FormSelectBase
    v-bind="props"
    id="source-select"
    v-model="selectedValue"
    label="How did you hear about Speckle?"
    placeholder="Select one"
    required
    :rules="isRequired"
    name="source"
    show-label
    allow-unset
    clearable
    :items="sources"
  >
    <template #option="{ item }">
      <div class="label label--light">
        {{ SourceTitleMap[item] }}
      </div>
    </template>
    <template #something-selected="{ value }">
      <span>{{ SourceTitleMap[isArrayValue(value) ? value[0] : value] }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { SourceTitleMap } from '~/lib/auth/helpers/onboarding'
import { OnboardingSource } from '@speckle/shared'
import { isRequired } from '~~/lib/common/helpers/validation'

const props = defineProps<{
  modelValue?: OnboardingSource
}>()

const emit = defineEmits<{
  (
    e: 'update:modelValue',
    value: OnboardingSource | OnboardingSource[] | undefined
  ): void
}>()

const sources = Object.values(OnboardingSource)

const { selectedValue, isArrayValue } = useFormSelectChildInternals<OnboardingSource>({
  props: toRefs(props),
  emit
})
</script>

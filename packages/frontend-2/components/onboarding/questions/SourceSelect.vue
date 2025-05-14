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
    :items="shuffledSources"
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
import { shuffle } from 'lodash-es'

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

const shuffledSources = computed(() => {
  // Filter out "Other" and shuffle the remaining sources
  const sourcesWithoutOther = sources.filter(
    (source) => source !== OnboardingSource.Other
  )
  const shuffled = shuffle([...sourcesWithoutOther])
  // Add "Other" at the end
  return [...shuffled, OnboardingSource.Other]
})
</script>

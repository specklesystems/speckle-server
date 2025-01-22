<template>
  <FormSelectBase
    v-bind="props"
    v-model="selectedValue"
    label="What are you planning to do with Speckle?"
    placeholder="Select all that apply"
    required
    name="plan"
    show-label
    allow-unset
    clearable
    multiple
    :items="plans"
  >
    <template #option="{ item }">
      <div class="label label--light">
        {{ PlanTitleMap[item] }}
      </div>
    </template>
    <template #something-selected="{ value }">
      <span>{{ PlanTitleMap[isArrayValue(value) ? value[0] : value] }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { OnboardingPlan, PlanTitleMap } from '~/lib/auth/helpers/onboarding'

const props = defineProps<{
  modelValue?: OnboardingPlan[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: OnboardingPlan | OnboardingPlan[] | undefined): void
}>()

const plans = Object.values(OnboardingPlan)

const { selectedValue, isArrayValue } = useFormSelectChildInternals<OnboardingPlan>({
  props: toRefs(props),
  emit
})
</script>

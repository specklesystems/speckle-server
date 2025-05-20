<template>
  <FormSelectMulti
    v-bind="props"
    id="plan-select"
    v-model="selectedValue"
    label="What are you planning to do with Speckle?"
    placeholder="Select all that apply"
    required
    :rules="isRequired"
    name="plan"
    show-label
    allow-unset
    clearable
    :items="shuffledPlans"
  >
    <template #option="{ item }">
      <div class="label label--light">
        {{ PlanTitleMap[item] }}
      </div>
    </template>

    <template #something-selected="{ value }">
      <template v-if="value.length === 1">
        {{ PlanTitleMap[isArrayValue(value) ? value[0] : value] }}
      </template>
      <template v-else>{{ value.length }} items selected</template>
    </template>
  </FormSelectMulti>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { PlanTitleMap } from '~/lib/auth/helpers/onboarding'
import { OnboardingPlan } from '@speckle/shared'
import { isRequired } from '~~/lib/common/helpers/validation'
import { shuffle } from 'lodash-es'

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

const shuffledPlans = computed(() => shuffle([...plans]))
</script>

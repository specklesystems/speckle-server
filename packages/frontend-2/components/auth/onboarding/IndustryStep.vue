<template>
  <div class="h3 mb-8 text-center">Which industry are you in?</div>
  <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <FormCardButton
      v-for="(val, title) in OnboardingIndustry"
      :key="val"
      :model-value="modelValue.industry === val"
      @update:model-value="() => chooseIndustry(val)"
    >
      {{ title }}
    </FormCardButton>
  </div>
</template>
<script setup lang="ts">
import { OnboardingState, OnboardingIndustry } from '~~/lib/auth/helpers/onboarding'

const emit = defineEmits<{
  (e: 'update:modelValue', v: OnboardingState): void
}>()

const props = defineProps<{
  modelValue: OnboardingState
}>()

const chooseIndustry = (val: OnboardingIndustry) => {
  emit('update:modelValue', {
    ...props.modelValue,
    industry: val
  })
}
</script>

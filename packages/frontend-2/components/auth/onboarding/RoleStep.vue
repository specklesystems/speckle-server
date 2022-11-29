<template>
  <div class="h3 font-bold leading-9 mb-8 text-center">
    Which role represents you the most?
  </div>
  <div class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <FormCardButton
      v-for="val in OnboardingRole"
      :key="val"
      :model-value="modelValue.role === val"
      @update:model-value="() => chooseRole(val)"
    >
      {{ RoleTitleMap[val] }}
    </FormCardButton>
  </div>
</template>
<script setup lang="ts">
import {
  OnboardingState,
  OnboardingRole,
  RoleTitleMap
} from '~~/lib/auth/helpers/onboarding'

const emit = defineEmits<{
  (e: 'update:modelValue', v: OnboardingState): void
}>()

const props = defineProps<{
  modelValue: OnboardingState
}>()

const chooseRole = (val: OnboardingRole) => {
  emit('update:modelValue', {
    ...props.modelValue,
    role: val
  })
}
</script>

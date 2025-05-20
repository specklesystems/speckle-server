<template>
  <FormSelectBase
    v-bind="props"
    id="role-select"
    v-model="selectedValue"
    label="What's your role?"
    placeholder="Select one"
    required
    :rules="isRequired"
    name="role"
    show-label
    allow-unset
    clearable
    :items="shuffledRoles"
  >
    <template #option="{ item }">
      <div class="label label--light">
        {{ RoleTitleMap[item] }}
      </div>
    </template>
    <template #something-selected="{ value }">
      <span>{{ RoleTitleMap[isArrayValue(value) ? value[0] : value] }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import { RoleTitleMap } from '~/lib/auth/helpers/onboarding'
import { OnboardingRole } from '@speckle/shared'
import { isRequired } from '~~/lib/common/helpers/validation'
import { shuffle } from 'lodash'

const props = defineProps<{
  modelValue?: OnboardingRole
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: OnboardingRole | OnboardingRole[] | undefined): void
}>()

const roles = Object.values(OnboardingRole)

const { selectedValue, isArrayValue } = useFormSelectChildInternals<OnboardingRole>({
  props: toRefs(props),
  emit
})

const shuffledRoles = computed(() => {
  // Filter out "Other" and shuffle the remaining roles
  const rolesWithoutOther = roles.filter((role) => role !== OnboardingRole.Other)
  const shuffled = shuffle([...rolesWithoutOther])
  // Add "Other" at the end
  return [...shuffled, OnboardingRole.Other]
})
</script>

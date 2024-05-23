<template>
  <div class="flex flex-col gap-2">
    <FormTextInput
      v-model="automationName"
      name="automationName"
      label="Name"
      show-label
      help="Give your automation a name."
      placeholder="Automation Name"
      :rules="nameRules"
      show-required
      validate-on-value-update
    />
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { FormTextInput, ValidationHelpers } from '@speckle/ui-components'

const automationName = defineModel<Optional<string>>('automationName', {
  required: true
})

const nameRules = computed(() => [
  ValidationHelpers.isRequired,
  ValidationHelpers.isStringOfLength({ maxLength: 150 })
])
</script>

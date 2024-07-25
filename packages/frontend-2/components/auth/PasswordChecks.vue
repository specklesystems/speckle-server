<template>
  <div>
    <div
      class="grid grid-cols-2 text-body-2xs text-foreground-2 justify-between gap-y-1"
    >
      <div class="flex items-center space-x-2">
        <CheckIcon v-if="ruleFits(passwordLongEnough)" class="w-4 h-4 text-success" />
        <XMarkIcon v-else class="w-4 h-4 text-foreground-2" />
        <div>8+ characters long</div>
      </div>
      <div class="flex items-center space-x-2">
        <CheckIcon
          v-if="ruleFits(passwordHasAtLeastOneNumber)"
          class="w-4 h-4 text-success"
        />
        <XMarkIcon v-else class="w-4 h-4 text-foreground-2" />
        <div>One number</div>
      </div>
      <div class="flex items-center space-x-2">
        <CheckIcon
          v-if="ruleFits(passwordHasAtLeastOneLowercaseLetter)"
          class="w-4 h-4 text-success"
        />
        <XMarkIcon v-else class="w-4 h-4 text-foreground-2" />
        <div>One lowercase letter</div>
      </div>
      <div class="flex items-center space-x-2">
        <CheckIcon
          v-if="ruleFits(passwordHasAtLeastOneUppercaseLetter)"
          class="w-4 h-4 text-success"
        />
        <XMarkIcon v-else class="w-4 h-4 text-foreground-2" />
        <div>One uppercase letter</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GenericValidateFunction } from 'vee-validate'
import {
  passwordLongEnough,
  passwordHasAtLeastOneNumber,
  passwordHasAtLeastOneLowercaseLetter,
  passwordHasAtLeastOneUppercaseLetter
} from '~~/lib/auth/helpers/validation'

import { CheckIcon, XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  password: string
}>()

const ruleFits = (rule: GenericValidateFunction<string>) =>
  rule(props.password, { field: '', form: {}, value: props.password }) === true
</script>

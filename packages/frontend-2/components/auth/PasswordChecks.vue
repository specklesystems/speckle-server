<template>
  <div>
    <div
      class="grid grid-cols-2 text-body-2xs text-foreground-2 justify-between gap-y-1"
    >
      <div class="flex items-center space-x-2">
        <Check
          v-if="ruleFits(passwordLongEnough)"
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-success"
        />
        <X v-else class="h-8 w-8 text-foreground-2" />
        <div>8+ characters long</div>
      </div>
      <div class="flex items-center space-x-2">
        <Check
          v-if="ruleFits(passwordHasAtLeastOneNumber)"
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-success"
        />
        <X
          v-else
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-foreground-2"
        />
        <div>One number</div>
      </div>
      <div class="flex items-center space-x-2">
        <Check
          v-if="ruleFits(passwordHasAtLeastOneLowercaseLetter)"
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-success"
        />
        <X
          v-else
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="h-8 w-8 text-foreground-2"
        />
        <div>One lowercase letter</div>
      </div>
      <div class="flex items-center space-x-2">
        <Check
          v-if="ruleFits(passwordHasAtLeastOneUppercaseLetter)"
          :size="LucideSize.base"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-success"
        />
        <X
          v-else
          :size="32"
          :stroke-width="1.5"
          :absolute-stroke-width="true"
          class="text-foreground-2"
        />
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

import { Check, X } from 'lucide-vue-next'

const props = defineProps<{
  password: string
}>()

const ruleFits = (rule: GenericValidateFunction<string>) =>
  rule(props.password, { field: '', form: {}, value: props.password }) === true
</script>

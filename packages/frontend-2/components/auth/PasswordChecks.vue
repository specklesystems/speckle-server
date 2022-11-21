<template>
  <ul
    class="password-checks block space-y-1 columns-1 sm:columns-2 list-disc list-inside"
  >
    <li :class="listItemClasses(passwordLongEnough)">A minimum of 8 characters</li>
    <li :class="listItemClasses(passwordHasAtLeastOneNumber)">At least one number</li>
    <li :class="listItemClasses(passwordHasAtLeastOneLowercaseLetter)">
      At least one lowercase letter
    </li>
    <li :class="listItemClasses(passwordHasAtLeastOneUppercaseLetter)">
      At least one uppercase letter
    </li>
  </ul>
</template>
<script setup lang="ts">
import { GenericValidateFunction } from 'vee-validate'
import {
  passwordLongEnough,
  passwordHasAtLeastOneNumber,
  passwordHasAtLeastOneLowercaseLetter,
  passwordHasAtLeastOneUppercaseLetter
} from '~~/lib/auth/helpers/validation'

const props = defineProps<{
  password: string
}>()

const ruleFits = (rule: GenericValidateFunction<string>) =>
  rule(props.password, { field: '', form: {}, value: props.password }) === true
const listItemClasses = (rule: GenericValidateFunction<string>) => [
  ruleFits(rule) ? 'check-succeeds' : 'check-fails'
]
</script>
<style scoped>
.password-checks {
  & li.check-succeeds {
    list-style-type: none;

    &::before {
      content: '✓';
      color: #10b981;
      margin-right: 6px;
    }
  }
}
</style>

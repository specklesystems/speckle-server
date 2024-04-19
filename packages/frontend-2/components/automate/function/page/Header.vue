<template>
  <div class="pt-4 flex items-center justify-between">
    <Portal to="navigation">
      <HeaderNavLink
        :to="automationFunctionsRoute"
        :name="'Automate Functions'"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="automationFunctionRoute(fn.id)"
        :name="fn.name"
      ></HeaderNavLink>
    </Portal>
    <div class="flex items-center gap-4">
      <AutomateFunctionLogo :logo="fn.logo" />
      <h1 class="h3 font-bold">{{ fn.name }}</h1>
      <FormButton v-if="isOwner" size="sm" text class="mt-1" @click="$emit('edit')">
        Edit
      </FormButton>
    </div>
    <div class="flex gap-2">
      <FormButton :icon-left="BoltIcon" @click="$emit('createAutomation')">
        Create Automation
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { BoltIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageHeader_FunctionFragment } from '~/lib/common/generated/gql/graphql'
import {
  automationFunctionRoute,
  automationFunctionsRoute
} from '~/lib/common/helpers/route'

defineEmits<{
  createAutomation: []
  edit: []
}>()

graphql(`
  fragment AutomateFunctionPageHeader_Function on AutomateFunction {
    id
    name
    logo
    creator {
      id
    }
  }
`)

defineProps<{
  fn: AutomateFunctionPageHeader_FunctionFragment
  isOwner: boolean
}>()
</script>

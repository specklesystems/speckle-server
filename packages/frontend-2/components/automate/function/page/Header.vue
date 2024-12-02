<template>
  <div class="pt-4 flex gap-4 flex-col sm:flex-row sm:items-center sm:justify-between">
    <Portal to="navigation">
      <HeaderNavLink
        :to="automationFunctionsRoute"
        :separator="false"
        name="Automate functions"
      />
      <HeaderNavLink :to="automationFunctionRoute(fn.id)" :name="fn.name" />
    </Portal>
    <div class="flex items-center gap-4">
      <AutomateFunctionLogo :logo="fn.logo" />
      <h1 class="text-heading-lg">{{ fn.name }}</h1>
    </div>
    <div class="flex items-center align-center gap-2">
      <FormButton v-if="isOwner" color="outline" @click="$emit('edit')">
        Edit
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateFunctionPageHeader_FunctionFragment } from '~/lib/common/generated/gql/graphql'
import {
  automationFunctionRoute,
  automationFunctionsRoute
} from '~/lib/common/helpers/route'

graphql(`
  fragment AutomateFunctionPageHeader_Function on AutomateFunction {
    id
    name
    logo
    repo {
      id
      url
      owner
      name
    }
    releases(limit: 1) {
      totalCount
    }
    workspaceIds
  }
`)

defineProps<{
  fn: AutomateFunctionPageHeader_FunctionFragment
  isOwner: boolean
}>()

defineEmits<{
  createAutomation: []
  edit: []
}>()
</script>

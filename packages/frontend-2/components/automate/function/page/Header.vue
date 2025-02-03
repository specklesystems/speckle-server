<template>
  <div class="pt-4 flex gap-4 flex-col sm:flex-row sm:items-center sm:justify-between">
    <Portal to="navigation">
      <template v-if="fnWorkspace">
        <HeaderNavLink
          :to="workspaceRoute(fnWorkspace.slug)"
          :separator="false"
          :name="fnWorkspace.name"
        />
        <HeaderNavLink
          :to="automateFunctionsRoute(fnWorkspace.slug)"
          name="Functions"
        />
        <HeaderNavLink :to="automateFunctionRoute(fn.id)" :name="fn.name" />
      </template>
      <template v-else>
        <HeaderNavLink
          :to="automateFunctionsRoute()"
          :separator="false"
          name="Functions"
        />
        <HeaderNavLink :to="automateFunctionRoute(fn.id)" :name="fn.name" />
      </template>
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
import type {
  AutomateFunctionPageHeader_FunctionFragment,
  AutomateFunctionPageHeader_WorkspaceFragment
} from '~/lib/common/generated/gql/graphql'
import {
  automateFunctionRoute,
  automateFunctionsRoute,
  workspaceRoute
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

  fragment AutomateFunctionPageHeader_Workspace on Workspace {
    id
    name
    slug
  }
`)

defineProps<{
  fn: AutomateFunctionPageHeader_FunctionFragment
  fnWorkspace?: AutomateFunctionPageHeader_WorkspaceFragment
  isOwner: boolean
}>()

defineEmits<{
  createAutomation: []
  edit: []
}>()
</script>

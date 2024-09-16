<template>
  <div class="pt-4 flex gap-4 flex-col sm:flex-row sm:items-center sm:justify-between">
    <Portal to="navigation">
      <HeaderNavLink
        :to="automationFunctionsRoute"
        :name="'Automate functions'"
      ></HeaderNavLink>
      <HeaderNavLink
        :to="automationFunctionRoute(fn.id)"
        :name="fn.name"
      ></HeaderNavLink>
    </Portal>
    <div class="flex items-center gap-4">
      <AutomateFunctionLogo :logo="fn.logo" />
      <h1 class="text-heading-lg">{{ fn.name }}</h1>
      <FormButton v-if="isOwner" size="sm" text class="mt-1" @click="$emit('edit')">
        Edit
      </FormButton>
    </div>
    <div
      v-tippy="
        hasReleases ? undefined : 'Your function needs to have at least one release'
      "
      class="flex gap-2 shrink-0"
    >
      <FormButton
        :icon-left="BoltIcon"
        class="shrink-0"
        full-width
        :disabled="!hasReleases"
        @click="$emit('createAutomation')"
      >
        Use in an automation
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
    repo {
      id
      url
      owner
      name
    }
    releases(limit: 1) {
      totalCount
    }
  }
`)

const props = defineProps<{
  fn: AutomateFunctionPageHeader_FunctionFragment
  isOwner: boolean
}>()

const hasReleases = computed(() => props.fn.releases.totalCount > 0)
</script>

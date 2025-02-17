<template>
  <div class="flex flex-col gap-6 mb-4">
    <div class="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:gap-x-4 w-full">
      <UserAvatarEditable
        v-model:edit-mode="avatarEditMode"
        name="image"
        placeholder="FN"
        size="xxl"
        @update:model-value="avatarEditMode = false"
      />

      <FormTextInput
        size="lg"
        name="name"
        label="Function name"
        placeholder="Name"
        color="foundation"
        help="This will be the function's display and repository name."
        show-label
        :rules="nameRules"
        validate-on-value-update
        wrapper-classes="flex-1"
        autocomplete="off"
      />
    </div>
    <FormMarkdownEditor
      name="description"
      label="Description"
      show-label
      show-required
      :rules="descriptionRules"
      validate-on-value-update
    />
    <FormSelectBase
      v-if="workspaces?.length"
      name="workspace"
      label="Workspace"
      placeholder="Select a workspace"
      show-label
      allow-unset
      clearable
      help="Allow automations in one of your workspaces to use this function."
      :items="workspaces"
    >
      <template #something-selected="{ value }">
        <div class="label label--light">
          {{ isArray(value) ? value[0].name : value.name }}
        </div>
      </template>
      <template #option="{ item, selected }">
        <div class="flex flex-col">
          <div :class="['label label--light', selected ? 'text-primary' : '']">
            {{ item.name }}
          </div>
        </div>
      </template>
    </FormSelectBase>
    <FormSelectSourceApps
      name="allowedSourceApps"
      label="Supported source apps"
      show-label
      multiple
      help="Versions submitted from these apps will support this function. If left empty, all apps will be supported."
      clearable
      button-style="tinted"
      validate-on-value-update
      show-optional
    />
    <FormTags
      name="tags"
      color="foundation"
      label="Tags"
      show-label
      show-clear
      help="Appropriate tags will help other people find your function."
      validate-on-value-update
      show-optional
    />
    <FormSelectBase
      v-if="githubOrgs?.length"
      name="org"
      label="Organization"
      show-label
      allow-unset
      button-style="tinted"
      clearable
      show-optional
      placeholder="Choose a GitHub organization"
      help="Choose an organization to publish your Git repository to. If left empty, it will be published to your personal account."
      :items="githubOrgs"
      mount-menu-on-body
      validate-on-value-update
    >
      <template #something-selected="{ value }">
        <div class="label label--light">
          {{ isArray(value) ? value[0] : value }}
        </div>
      </template>
      <template #option="{ item, selected }">
        <div class="flex flex-col">
          <div :class="['label label--light', selected ? 'text-primary' : '']">
            {{ item }}
          </div>
        </div>
      </template>
    </FormSelectBase>
  </div>
</template>
<script setup lang="ts">
import { ValidationHelpers } from '@speckle/ui-components'
import { isArray } from 'lodash-es'
import type { AutomateFunctionCreateDialog_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

defineProps<{
  githubOrgs?: string[]
  workspaces?: AutomateFunctionCreateDialog_WorkspaceFragment[]
}>()

const avatarEditMode = ref(false)

const nameRules = computed(() => [
  ValidationHelpers.isRequired,
  ValidationHelpers.isStringOfLength({ maxLength: 150 })
])
const descriptionRules = computed(() => [ValidationHelpers.isRequired])
</script>

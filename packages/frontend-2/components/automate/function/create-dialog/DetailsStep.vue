<template>
  <div class="flex flex-col gap-6 mb-4">
    <div class="flex flex-col gap-2 sm:gap-0 sm:flex-row w-full">
      <UserAvatarEditable
        v-model:edit-mode="avatarEditMode"
        name="image"
        placeholder="F N"
        size="xxl"
        class="sm:w-5/12"
        @update:model-value="avatarEditMode = false"
      />
      <div class="sm:w-7/12">
        <FormTextInput
          size="lg"
          name="name"
          label="Name"
          placeholder="Function Name"
          color="foundation"
          help="This will be used as the function's display name and also as the name of the Git repository."
          show-label
          show-required
          :rules="nameRules"
          validate-on-value-update
          autocomplete="off"
        />
      </div>
    </div>
    <FormMarkdownEditor
      name="description"
      label="Description"
      show-label
      show-required
      :rules="descriptionRules"
      validate-on-value-update
    />
    <FormSelectSourceApps
      name="allowedSourceApps"
      label="Supported source apps"
      show-label
      multiple
      help="Versions submitted from these apps will support this function. If left empty, all apps will be supported."
      clearable
      button-style="tinted"
      validate-on-value-update
    />
    <FormTags
      name="tags"
      color="foundation"
      label="Tags"
      show-label
      show-clear
      help="Appropriate tags will help other people find your function."
      validate-on-value-update
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

defineProps<{
  githubOrgs?: string[]
}>()

const avatarEditMode = ref(false)

const nameRules = computed(() => [
  ValidationHelpers.isRequired,
  ValidationHelpers.isStringOfLength({ maxLength: 150 })
])
const descriptionRules = computed(() => [ValidationHelpers.isRequired])
</script>

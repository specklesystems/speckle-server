<template>
  <FormSelectBase
    v-model="selectedValue"
    :multiple="false"
    :items="items"
    label="Select workspace"
    show-label
    name="workspace"
    :disabled="disabled"
    help="You may need to authenticate separately for each workspace you want to access."
  >
    <template #option="{ item }">
      <div class="flex items-center gap-2">
        <WorkspaceAvatar
          :logo="item.logo"
          :default-logo-index="item.defaultLogoIndex"
          size="xs"
        />
        <span>{{ item.name }}</span>
      </div>
    </template>
    <template #nothing-selected>Select a workspace</template>
    <template #something-selected="{ value }">
      <div v-if="!isArrayValue(value)" class="flex items-center gap-2">
        <WorkspaceAvatar
          :logo="value.logo"
          :default-logo-index="value.defaultLogoIndex"
          size="xs"
        />
        <span>{{ value.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { useFormSelectChildInternals } from '@speckle/ui-components'
import type { AuthSsoLogin_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  modelValue?: AuthSsoLogin_WorkspaceFragment
  items: AuthSsoLogin_WorkspaceFragment[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'update:modelValue',
    v: AuthSsoLogin_WorkspaceFragment | AuthSsoLogin_WorkspaceFragment[] | undefined
  ): void
}>()

const { selectedValue, isArrayValue } =
  useFormSelectChildInternals<AuthSsoLogin_WorkspaceFragment>({
    props: toRefs(props),
    emit
  })
</script>

<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="items"
    name="workspaceSelect"
    label="Workspace"
    class="min-w-[110px]"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    fully-control-value
    clearable
    :disabled-item-predicate="disabledItemPredicate"
    disabled-item-tooltip="You dont have rights to create projects in this workspace"
  >
    <template #nothing-selected>
      {{ 'Select workspace' }}
    </template>
    <template #something-selected="{ value }">
      <div class="flex items-center gap-x-2">
        <WorkspaceAvatar
          :logo="(value as ProjectsAddDialog_WorkspaceFragment).logo"
          :default-logo-index="(value as ProjectsAddDialog_WorkspaceFragment).defaultLogoIndex"
          size="2xs"
        />
        <span class="truncate text-foreground">
          {{ (value as ProjectsAddDialog_WorkspaceFragment).name }}
        </span>
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex items-center gap-x-2">
        <WorkspaceAvatar
          :logo="item.logo"
          :default-logo-index="item.defaultLogoIndex"
          size="2xs"
        />
        <span class="truncate text-foreground">{{ item.name }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import type { PropType } from 'vue'
import { Roles } from '@speckle/shared'
import type { ProjectsAddDialog_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

const emit = defineEmits<{
  (
    e: 'update:modelValue',
    v:
      | ProjectsAddDialog_WorkspaceFragment
      | ProjectsAddDialog_WorkspaceFragment[]
      | undefined
  ): void
}>()

const props = defineProps({
  modelValue: {
    type: Object as PropType<ProjectsAddDialog_WorkspaceFragment | undefined>,
    default: undefined
  },
  items: Array as PropType<ProjectsAddDialog_WorkspaceFragment[]>,
  disabledItems: {
    required: false,
    type: Array as PropType<ProjectsAddDialog_WorkspaceFragment[]>
  }
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue } =
  useFormSelectChildInternals<ProjectsAddDialog_WorkspaceFragment>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const disabledItemPredicate = (item: ProjectsAddDialog_WorkspaceFragment) =>
  item.role === Roles.Workspace.Guest
</script>

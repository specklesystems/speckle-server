<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="roles"
    :multiple="multiple"
    name="workspaceRoles"
    :label="label"
    class="min-w-[110px]"
    :label-id="labelId"
    :button-id="buttonId"
    mount-menu-on-body
    :show-label="showLabel"
    :fully-control-value="fullyControlValue"
    :disabled="disabled"
    :disabled-item-predicate="disabledItemPredicate"
    :clearable="clearable"
  >
    <template #nothing-selected>
      {{ multiple ? 'Select roles' : 'Select role' }}
    </template>
    <template #something-selected="{ value }">
      <template v-if="isMultiItemArrayValue(value)">
        <div ref="elementToWatchForChanges" class="flex items-center space-x-0.5">
          <div
            ref="itemContainer"
            class="flex flex-wrap overflow-hidden space-x-0.5 h-6"
          >
            <div v-for="(item, i) in value" :key="item" class="text-foreground">
              {{ RoleInfo.Workspace[item] + (i < value.length - 1 ? ', ' : '') }}
            </div>
          </div>
          <div v-if="hiddenSelectedItemCount > 0" class="text-foreground-2 normal">
            +{{ hiddenSelectedItemCount }}
          </div>
        </div>
      </template>
      <template v-else>
        <div class="truncate text-foreground">
          {{ RoleInfo.Workspace[firstItem(value)].title }}
        </div>
      </template>
    </template>
    <template #option="{ item }">
      <div class="flex items-center">
        <span class="truncate">{{ RoleInfo.Workspace[firstItem(item)].title }}</span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
// TODO: Refactor this to have one component for project/server/workspace roles

import { Roles, RoleInfo } from '@speckle/shared'
import type { Nullable, WorkspaceRoles } from '@speckle/shared'
import { useFormSelectChildInternals } from '@speckle/ui-components'
import type { PropType } from 'vue'

type ValueType = WorkspaceRoles | WorkspaceRoles[] | undefined

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const props = defineProps({
  multiple: Boolean,
  modelValue: {
    type: [String, Array] as PropType<ValueType>,
    default: undefined
  },
  fullyControlValue: Boolean,
  label: {
    type: String,
    default: 'Workspace Roles'
  },
  disabled: Boolean,
  disabledItems: {
    required: false,
    type: Array as PropType<WorkspaceRoles[]>
  },
  showLabel: Boolean,
  clearable: Boolean
})

const elementToWatchForChanges = ref(null as Nullable<HTMLElement>)
const itemContainer = ref(null as Nullable<HTMLElement>)
const labelId = useId()
const buttonId = useId()

const { selectedValue, isMultiItemArrayValue, hiddenSelectedItemCount, firstItem } =
  useFormSelectChildInternals<WorkspaceRoles>({
    props: toRefs(props),
    emit,
    dynamicVisibility: { elementToWatchForChanges, itemContainer }
  })

const roles = computed(() => Object.values(Roles.Workspace))

const disabledItemPredicate = (item: WorkspaceRoles) =>
  props.disabledItems && props.disabledItems.length > 0
    ? props.disabledItems.includes(item)
    : false
</script>

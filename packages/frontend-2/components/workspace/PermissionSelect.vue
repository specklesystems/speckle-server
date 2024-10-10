<template>
  <FormSelectBase
    v-model="modelWrapper"
    :items="Object.values(items)"
    label="Workspace access level"
    button-style="simple"
    :show-label="showLabel"
    :name="name || 'role'"
    :allow-unset="false"
    :disabled="disabled"
    :label-id="labelId"
    :button-id="buttonId"
    by="id"
    class="min-w-60"
    mount-menu-on-body
  >
    <template #something-selected="{ value }">
      <div class="text-normal text-right">
        {{ isArray(value) ? value[0].title : value.title }}
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex flex-col space-y-0.5">
        <span class="truncate font-medium">
          {{ item.title }}
        </span>
        <span v-if="item.description" class="text-body-2xs text-foreground-2">
          {{ item.description }}
        </span>
      </div>
    </template>
  </FormSelectBase>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { WorkspaceRoles } from '@speckle/shared'
import { reduce, isArray } from 'lodash-es'
import { roleSelectItems } from '~/lib/workspaces/helpers/roles'

const emit = defineEmits<{
  (e: 'delete'): void
}>()

const props = defineProps<{
  label?: string
  showLabel?: boolean
  name?: string
  disabled?: boolean
  hideOwner?: boolean
}>()

const labelId = useId()
const buttonId = useId()
const items = ref(
  reduce(
    roleSelectItems,
    (results, item) => {
      if (item.id === Roles.Workspace.Admin) {
        if (!props.hideOwner) {
          results[item.id] = item
        }
      } else {
        results[item.id] = item
      }

      return results
    },
    {} as typeof roleSelectItems
  )
)

const model = defineModel<WorkspaceRoles>({ required: true })

const modelWrapper = computed({
  get: () => items.value[model.value],
  set: (newVal) => {
    if (newVal.id === 'delete') return emit('delete')
    model.value = newVal.id
  }
})
</script>

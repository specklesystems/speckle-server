<template>
  <FormSelectBase
    v-model="selectedValue"
    :items="roles"
    :label="'Role'"
    :name="'userRole'"
    :allow-unset="false"
  >
    <template #something-selected="{ value }">
      <span class="truncate">{{ getRoleLabel(value) }}</span>
    </template>

    <template #option="{ item }">
      <span class="truncate">{{ getRoleLabel(item) }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { Roles, ServerRoles } from '@speckle/shared/src/core/constants'
import { useFormSelectChildInternals } from '~~/lib/form/composables/select'

type ValueType = ServerRoles | ServerRoles[] | undefined

type Role = ServerRoles

const props = defineProps<{
  modelValue?: ValueType
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ValueType): void
}>()

const { selectedValue } = useFormSelectChildInternals<ServerRoles>({
  props: toRefs(props),
  emit
})

const roleLookupTable = {
  [Roles.Server.User]: 'User',
  [Roles.Server.Admin]: 'Admin',
  [Roles.Server.ArchivedUser]: 'Archived',
  [Roles.Server.Guest]: 'Guest'
}

const getRoleLabel = (role: Role) => {
  return roleLookupTable[role] || role.split(':')[1]
}

const roles = Object.values(Roles.Server).filter((role) => role in roleLookupTable)
</script>

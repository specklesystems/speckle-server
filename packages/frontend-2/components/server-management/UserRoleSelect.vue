<template>
  <FormSelectBase v-model="selectedValue" :items="roles" :label="'Role'" :name="'role'">
    <template #something-selected="{ value }">
      <span class="truncate">{{ getRoleLabel(value) }}</span>
    </template>

    <template #option="{ item }">
      <span class="truncate">{{ getRoleLabel(item) }}</span>
    </template>
  </FormSelectBase>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Roles, ServerRoles } from '@speckle/shared/src/core/constants'

type Role = ServerRoles

const emitUpdate = defineEmits<{
  (e: 'update:modelValue', newV: string, oldV: string): void
}>()

const roleLookupTable = {
  [Roles.Server.User]: 'User',
  [Roles.Server.Admin]: 'Admin',
  [Roles.Server.ArchivedUser]: 'Archived',
  [Roles.Server.Guest]: 'Guest'
}

const getRoleLabel = (role: Role) => {
  return roleLookupTable[role] || role.split(':')[1]
}

const selectedValue = ref<Role>('server:user')

const roles = Object.values(Roles.Server).filter((role) => role in roleLookupTable)

watch(selectedValue, (newVal, oldVal) => {
  emitUpdate('update:modelValue', newVal, oldVal)
})
</script>
